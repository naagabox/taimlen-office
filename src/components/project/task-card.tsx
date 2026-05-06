"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { ExternalLink, GripVertical, Pencil, Trash2 } from "lucide-react"
import { Task } from "./task-board"

interface TaskCardProps {
  task: Task
  statusId: string
  canEdit: boolean
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
  onToggle: (taskId: string, completed: boolean) => void
}

function getCardColor(statusId: string) {
  switch (statusId) {
    case "NOT_STARTED": return "border-l-amber-500"
    case "IN_PROGRESS": return "border-l-blue-500"
    case "FINISHED": return "border-l-green-500"
    default: return "border-l-gray-500"
  }
}

export function TaskCard({ task, statusId, canEdit, onEdit, onDelete }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg border p-3 shadow-sm border-l-4 ${getCardColor(statusId)} ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
        <span className="flex-1 text-sm">{task.title}</span>
        {task.attachmentUrl && (
          <a
            href={task.attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
        {canEdit && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => onEdit(task)}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
              onClick={() => onDelete(task.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}