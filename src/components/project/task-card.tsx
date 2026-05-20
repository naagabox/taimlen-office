"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Check, Copy, ExternalLink, GripVertical, Pencil, Trash2, Clock } from "lucide-react"
import { Task } from "./task-board"

interface TaskCardProps {
  task: Task
  statusId: string
  canEdit: boolean
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
  onToggle: (taskId: string, completed: boolean) => void
  onExtend: (task: Task) => void
}

function getCardColor(statusId: string) {
  switch (statusId) {
    case "NOT_STARTED": return "border-l-amber-500"
    case "IN_PROGRESS": return "border-l-blue-500"
    case "FINISHED": return "border-l-green-500"
    default: return "border-l-gray-500"
  }
}

export function TaskCard({ task, statusId, canEdit, onEdit, onDelete, onExtend }: TaskCardProps) {
  const [copied, setCopied] = useState(false)

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

  const attachmentCount = task.attachments?.length || 0

  const handleCopy = async () => {
    await navigator.clipboard.writeText(task.title)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-3 shadow-sm border-l-4 ${getCardColor(statusId)} ${
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
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
          onClick={handleCopy}
          title="Copy title"
        >
          {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
        </Button>
        <span className="flex-1 text-sm text-gray-900 dark:text-white">{task.title}</span>
        {attachmentCount > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">{attachmentCount}</span>
            <a
              href={task.attachments?.[0]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" />
            </a>
            {attachmentCount > 1 && (
              <span className="text-xs text-gray-400">+{attachmentCount - 1}</span>
            )}
          </div>
        )}
        {canEdit && (
          <div className="flex gap-1">
            {statusId !== "FINISHED" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-blue-500 hover:text-blue-600"
                onClick={() => onExtend(task)}
                title="Extend Time"
              >
                <Clock className="h-3 w-3" />
              </Button>
            )}
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