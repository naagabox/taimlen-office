"use client"

import { format } from "date-fns"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Calendar, Users } from "lucide-react"
import { TaskBoard } from "./task-board"

interface Task {
  id: string
  title: string
  description: string | null
  dueDate: string | null
  completed: boolean
  status: "NOT_STARTED" | "IN_PROGRESS" | "FINISHED"
  order: number
  attachmentUrl: string | null
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

export function ProjectDetail({ project, canEdit }: Props) {

  return (
    <div className="mx-auto max-w-full px-6 py-8">
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
          <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
          <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
        </div>
        {project.description && <p className="mt-1 text-gray-600">{project.description}</p>}
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-10">
          <Card>
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <TaskBoard project={project} canEdit={canEdit} />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
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
              <p className="text-sm text-gray-500">
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
                  <p className="text-gray-500">Owner</p>
                </div>
              </div>
              {project.members.map((member) => (
                <div key={member.user.email} className="mt-3 flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{getInitials(member.user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <p className="font-medium">{member.user.name}</p>
                    <p className="text-gray-500">{member.role}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}