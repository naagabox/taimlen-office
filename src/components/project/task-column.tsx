"use client"

import { useDroppable } from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TaskCard } from "./task-card"
import { Task } from "./task-board"

const COLUMNS = [
  { id: "NOT_STARTED", title: "To Do", color: "bg-amber-500" },
  { id: "IN_PROGRESS", title: "In Progress", color: "bg-blue-500" },
  { id: "FINISHED", title: "Finished", color: "bg-green-500" },
]

function getStatusColor(statusId: string) {
  switch (statusId) {
    case "NOT_STARTED": return "border-l-amber-500"
    case "IN_PROGRESS": return "border-l-blue-500"
    case "FINISHED": return "border-l-green-500"
    default: return "border-l-gray-500"
  }
}

function getHeaderColor(statusId: string) {
  switch (statusId) {
    case "NOT_STARTED": return "text-amber-600"
    case "IN_PROGRESS": return "text-blue-600"
    case "FINISHED": return "text-green-600"
    default: return "text-gray-600"
  }
}

interface TaskColumnProps {
  id: string
  title: string
  tasks: Task[]
  canEdit: boolean
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
  onToggle: (taskId: string, completed: boolean) => void
}

export function TaskColumn({ id, title, tasks, canEdit, onEdit, onDelete, onToggle }: TaskColumnProps) {
  const columnIds = COLUMNS.map(col => col.id)
  const isColumn = columnIds.includes(id)
  
  if (!isColumn) return null
  
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <Card className={getStatusColor(id)}>
      <CardHeader className="pb-3">
        <CardTitle className={`text-base font-semibold flex items-center justify-between ${getHeaderColor(id)}`}>
          {title}
          <span className="text-sm font-normal text-gray-500 ml-2">({tasks.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent
        ref={setNodeRef}
        className={`min-h-[200px] space-y-2 ${isOver ? "bg-gray-50" : ""}`}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              statusId={id}
              canEdit={canEdit}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggle={onToggle}
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">No tasks</p>
        )}
      </CardContent>
    </Card>
  )
}