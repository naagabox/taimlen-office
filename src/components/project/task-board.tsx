"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core"
import {
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Loader2, Pencil, GripVertical, Link, ExternalLink, Trash2, X } from "lucide-react"
import { TaskCard } from "./task-card"
import { TaskColumn } from "./task-column"
import { ActivityLog } from "./activity-log"

function formatCreatedAt(dateString: string): string {
  const date = new Date(dateString)
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ]
  const dayName = days[date.getDay()]
  const day = date.getDate()
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return `${dayName}, ${day} ${month} ${year} ${hours}:${minutes} WIB`
}

export type TaskStatus = "NOT_STARTED" | "IN_PROGRESS" | "FINISHED"

export interface Task {
  id: string
  title: string
  description: string | null
  dueDate: string | null
  completed: boolean
  status: TaskStatus
  order: number
  attachments: string[] | null
  createdAt: string
}

interface Member {
  role: "OWNER" | "EDITOR" | "VIEWER"
  user: { name: string | null; email: string; image: string | null }
}

interface Project {
  id: string
  name: string
  description: string | null
  dueDate: string
  status: "ACTIVE" | "COMPLETED" | "OVERDUE"
  createdAt: string
  user: { name: string | null; email: string; image: string | null }
  members: Member[]
  tasks: Task[]
}

interface Props {
  project: Project
  canEdit: boolean
}

const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: "NOT_STARTED", title: "To Do" },
  { id: "IN_PROGRESS", title: "In Progress" },
  { id: "FINISHED", title: "Finished" },
]

export function TaskBoard({ project, canEdit }: Props) {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newAttachmentUrl, setNewAttachmentUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const activityLogRef = useRef<{ refresh: () => void }>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    setTasks(project.tasks.map(t => ({ ...t, status: t.status as TaskStatus })))
  }, [project.tasks])

  useEffect(() => {
    const handleOpenDialog = () => setTaskDialogOpen(true)
    window.addEventListener('open-add-task-dialog', handleOpenDialog)
    return () => window.removeEventListener('open-add-task-dialog', handleOpenDialog)
  }, [])

  const tasksByColumn = COLUMNS.reduce((acc, col) => {
    acc[col.id] = tasks.filter((t) => t.status === col.id).sort((a, b) => a.order - b.order)
    return acc
  }, {} as Record<TaskStatus, Task[]>)

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeTask = tasks.find((t) => t.id === active.id)
    if (!activeTask) return

    let newStatus: TaskStatus = activeTask.status
    const overId = over.id as string

    if (COLUMNS.some(col => col.id === overId)) {
      newStatus = overId as TaskStatus
    } else {
      const overTask = tasks.find((t) => t.id === overId)
      if (overTask) newStatus = overTask.status
    }

    if (newStatus !== activeTask.status) {
      setTasks((items) => {
        const idx = items.findIndex((t) => t.id === active.id)
        const updated = [...items]
        updated[idx] = { ...updated[idx], status: newStatus }
        return updated
      })

      setLoading(true)
      try {
        await fetch(`/api/projects/${project.id}/tasks/${activeTask.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        })
        activityLogRef.current?.refresh()
      } catch (error) {
        console.error(error)
        setTasks((items) => {
          const idx = items.findIndex((t) => t.id === active.id)
          const updated = [...items]
          updated[idx] = { ...updated[idx], status: activeTask.status }
          return updated
        })
      } finally {
        setLoading(false)
      }
    }
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault()
    if (!newTaskTitle.trim()) return
    
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${project.id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTaskTitle }),
      })
      if (res.ok) {
        setNewTaskTitle("")
        setTaskDialogOpen(false)
        router.refresh()
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function handleEditTask(e: React.FormEvent) {
    e.preventDefault()
    if (!editingTask?.title.trim()) return
    
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${project.id}/tasks/${editingTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: editingTask.title,
          description: editingTask.description || null,
          attachments: editingTask.attachments || null,
        }),
      })
      if (res.ok) {
        setEditingTask(null)
        activityLogRef.current?.refresh()
        router.refresh()
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteTask(taskId: string) {
    if (!confirm("Are you sure you want to delete this task?")) return
    
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${project.id}/tasks/${taskId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        activityLogRef.current?.refresh()
        router.refresh()
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {COLUMNS.map((column) => (
            <TaskColumn
              key={column.id}
              id={column.id}
              title={column.title}
              tasks={tasksByColumn[column.id]}
              canEdit={canEdit}
              onEdit={setEditingTask}
              onDelete={handleDeleteTask}
              onToggle={() => {}}
            />
          ))}
          <DragOverlay>
            {activeTask ? (
              <div className="bg-white rounded-lg border p-3 shadow-lg opacity-80">
                <span className="text-sm">{activeTask.title}</span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <ActivityLog ref={activityLogRef} projectId={project.id} />

      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddTask} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="taskTitle">Task Title</Label>
              <Input
                id="taskTitle"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Enter task title"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Task
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {editingTask?.createdAt && (
            <p className="text-sm text-muted-foreground">
              Dibuat: {formatCreatedAt(editingTask.createdAt)}
            </p>
          )}
          <form onSubmit={handleEditTask} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editTaskTitle">Task Title</Label>
              <Input
                id="editTaskTitle"
                value={editingTask?.title || ""}
                onChange={(e) => editingTask && setEditingTask({...editingTask, title: e.target.value})}
                placeholder="Enter task title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editTaskDescription">Description</Label>
              <Textarea
                id="editTaskDescription"
                value={editingTask?.description || ""}
                onChange={(e) => editingTask && setEditingTask({...editingTask, description: e.target.value})}
                placeholder="Enter task description"
                rows={3}
              />
            </div>
            {editingTask?.status === "FINISHED" && (
              <div className="space-y-2">
                <Label>Attachments</Label>
                <div className="space-y-2">
                  {editingTask?.attachments?.map((url, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-500 hover:text-blue-600 break-all"
                      >
                        {url}
                      </a>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-600 shrink-0"
                        onClick={() => {
                          if (editingTask) {
                            const newAttachments = editingTask.attachments?.filter((_, i) => i !== index) || []
                            setEditingTask({ ...editingTask, attachments: newAttachments })
                          }
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      value={newAttachmentUrl}
                      onChange={(e) => setNewAttachmentUrl(e.target.value)}
                      placeholder="Add attachment URL..."
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          if (newAttachmentUrl.trim() && editingTask) {
                            const updatedAttachments = [...(editingTask.attachments || []), newAttachmentUrl.trim()]
                            setEditingTask({ ...editingTask, attachments: updatedAttachments })
                            setNewAttachmentUrl("")
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (newAttachmentUrl.trim() && editingTask) {
                          const updatedAttachments = [...(editingTask.attachments || []), newAttachmentUrl.trim()]
                          setEditingTask({ ...editingTask, attachments: updatedAttachments })
                          setNewAttachmentUrl("")
                        }
                      }}
                      disabled={!newAttachmentUrl.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}