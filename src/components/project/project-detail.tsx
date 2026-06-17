"use client"

import { useState } from "react"
import { format } from "date-fns"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Calendar, Users, Plus, ClipboardList, AlertCircle, CheckCircle, Clock } from "lucide-react"
import { TaskBoard } from "./task-board"

interface Task {
  id: string
  title: string
  description: string | null
  dueDate: string | null
  completed: boolean
  status: "NOT_STARTED" | "IN_PROGRESS" | "FINISHED"
  order: number
  attachments: string[] | null
  startDate: string | null
  durationDays: number | null
  leadName: string | null
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
  status: "ACTIVE" | "COMPLETED" | "OVERDUE" | "ARCHIVED"
  createdAt: string
  user: { name: string | null; email: string; image: string | null }
  members: Member[]
  tasks: Task[]
}

interface Props {
  project: Project
  canEdit: boolean
}

function getStatusColor(status: string) {
  switch (status) {
    case "ACTIVE": return "bg-blue-500"
    case "COMPLETED": return "bg-green-500"
    case "OVERDUE": return "bg-red-500"
    default: return "bg-gray-500"
  }
}

function getInitials(name: string | null) {
  if (!name) return "?"
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

export function ProjectDetail({ project: initialProject, canEdit }: Props) {
  const [project, setProject] = useState(initialProject)

  const handleTaskUpdate = (updatedTask: Task) => {
    setProject((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => 
        t.id === updatedTask.id ? updatedTask : t
      ),
    }))
  }

  return (
    <div className="mx-auto max-w-full px-6 py-0 mt-4">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/projects">Projects</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{project.name}</BreadcrumbPage>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Tasks</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
          <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
        </div>
        {project.description && <p className="mt-1 text-gray-600 dark:text-gray-300">{project.description}</p>}
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-10" style={{ marginBottom: "20px" }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Tasks</CardTitle>
              {canEdit && (
                <Button size="sm" onClick={() => window.dispatchEvent(new CustomEvent('open-add-task-dialog'))}>
                  <Plus className="h-4 w-4 mr-1" />Add Task
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <TaskBoard project={project} canEdit={canEdit} onTaskUpdate={handleTaskUpdate} />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-[15px]" style={{ marginBottom: "20px" }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Due Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {format(new Date(project.dueDate), "MMM d, yyyy")}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {format(new Date(project.dueDate), "EEEE")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{getInitials(project.user.name)}</AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <p className="font-medium">{project.user.name}</p>
                  <p className="text-gray-500 dark:text-gray-400">Owner</p>
                </div>
              </div>
              {project.members.map((member) => (
                <div key={member.user.email} className="mt-3 flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{getInitials(member.user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <p className="font-medium">{member.user.name}</p>
                    <p className="text-gray-500 dark:text-gray-400">{member.role}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              {project.tasks.filter(t => t.dueDate).length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No plans yet</p>
              ) : (
                <div className="space-y-2">
                  {project.tasks
                    .filter(t => t.dueDate)
                    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
                    .slice(0, 5)
                    .map((task) => {
                      const dueDate = new Date(task.dueDate!)
                      const now = new Date()
                      now.setHours(0, 0, 0, 0)
                      const isOverdue = dueDate < now

                      let IconComponent
                      let iconColor
                      let textColor

                      if (task.status === "FINISHED") {
                        IconComponent = CheckCircle
                        iconColor = "text-green-500"
                        textColor = "text-green-500"
                      } else if (task.status === "IN_PROGRESS") {
                        if (isOverdue) {
                          IconComponent = AlertCircle
                          iconColor = "text-orange-500"
                          textColor = "text-orange-500"
                        } else {
                          IconComponent = Clock
                          iconColor = "text-blue-500"
                          textColor = "text-gray-500 dark:text-gray-400"
                        }
                      } else {
                        if (isOverdue) {
                          IconComponent = AlertCircle
                          iconColor = "text-red-500"
                          textColor = "text-red-500"
                        } else {
                          IconComponent = Calendar
                          iconColor = "text-gray-400"
                          textColor = "text-gray-500 dark:text-gray-400"
                        }
                      }

                      return (
                        <div 
                          key={task.id} 
                          className="flex items-center gap-2 p-2 rounded-md bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                          onClick={() => {
                            const event = new CustomEvent('open-extend-dialog', { detail: { task } })
                            window.dispatchEvent(event)
                          }}
                        >
                          <IconComponent className={`h-4 w-4 ${iconColor} shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{task.title}</p>
                            <p className={`text-xs ${textColor}`}>
                              {format(dueDate, "MMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}