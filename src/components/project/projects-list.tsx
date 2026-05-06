"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Plus, Calendar, ArrowRight, Pencil, Trash2, Loader2 } from "lucide-react"

interface Project {
  id: string
  name: string
  description: string | null
  dueDate: string
  status: "ACTIVE" | "COMPLETED" | "OVERDUE"
  createdAt: string
  user: { name: string | null; email: string }
  members: { user: { name: string | null; email: string } }[]
  _count: { tasks: number }
  currentUserRole: "OWNER" | "EDITOR" | "VIEWER" | null
  canEdit: boolean
  isOwnerOnly: boolean
}

interface Props {
  projects: Project[]
}

function getStatusColor(status: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-blue-500"
    case "COMPLETED":
      return "bg-green-500"
    case "OVERDUE":
      return "bg-red-500"
    default:
      return "bg-gray-500"
  }
}

function getDaysRemaining(dueDate: string) {
  const now = new Date()
  const due = new Date(dueDate)
  const diff = due.getTime() - now.getTime()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  return days
}

export function ProjectsList({ projects }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeProjects = projects.filter((p) => p.status === "ACTIVE")
  const completedProjects = projects.filter((p) => p.status === "COMPLETED")
  const overdueProjects = projects.filter((p) => p.status === "OVERDUE")

  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [deletingProject, setDeletingProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const editId = searchParams.get("edit")
    const deleteId = searchParams.get("delete")
    
    if (editId) {
      const project = projects.find((p) => p.id === editId)
      if (project?.canEdit) {
        setEditingProject(project)
      }
    }
    if (deleteId) {
      const project = projects.find((p) => p.id === deleteId)
      if (project?.isOwnerOnly) {
        setDeletingProject(project)
      }
    }
  }, [searchParams, projects])

  function clearParams() {
    router.push("/projects")
  }

  async function handleEditProject(e: React.FormEvent) {
    e.preventDefault()
    if (!editingProject?.name.trim()) return
    
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${editingProject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingProject.name,
          description: editingProject.description || null,
        }),
      })
      if (res.ok) {
        setEditingProject(null)
        clearParams()
        router.refresh()
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteProject() {
    if (!deletingProject) return
    
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${deletingProject.id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setDeletingProject(null)
        clearParams()
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="mt-1 text-gray-600">Manage and track your projects</p>
        </div>
        <Link href="/projects/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-gray-500">No projects yet. Create your first project!</p>
            <Link href="/projects/new">
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {overdueProjects.length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-semibold text-red-600">
                Overdue ({overdueProjects.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {overdueProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </div>
          )}

          {activeProjects.length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Active ({activeProjects.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {activeProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </div>
          )}

          {completedProjects.length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-semibold text-green-600">
                Completed ({completedProjects.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {completedProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={!!editingProject} onOpenChange={(open: boolean) => { if (!open) { setEditingProject(null); clearParams() } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditProject} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editProjectName">Project Name</Label>
              <Input
                id="editProjectName"
                value={editingProject?.name || ""}
                onChange={(e) => editingProject && setEditingProject({...editingProject, name: e.target.value})}
                placeholder="Enter project name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editProjectDesc">Description</Label>
              <Input
                id="editProjectDesc"
                value={editingProject?.description || ""}
                onChange={(e) => editingProject && setEditingProject({...editingProject, description: e.target.value})}
                placeholder="Enter description (optional)"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingProject} onOpenChange={(open: boolean) => !open && setDeletingProject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            Are you sure you want to delete "{deletingProject?.name}"? This action cannot be undone and all tasks will be deleted.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setDeletingProject(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteProject} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function ProjectCard({ project }: { project: Project }) {
  const router = useRouter()
  const daysLeft = getDaysRemaining(project.dueDate)
  const isUrgent = daysLeft <= 7 && daysLeft > 0
  const [showActions, setShowActions] = useState(false)

  return (
    <Link href={`/projects/${project.id}`}>
      <Card 
        className="h-full transition-shadow hover:shadow-md group"
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg pr-2">{project.name}</CardTitle>
            <div className="flex items-center gap-1 flex-shrink-0">
              {project.canEdit && showActions && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    router.push(`/projects?edit=${project.id}`)
                  }}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
              {project.isOwnerOnly && showActions && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-500 hover:text-red-600"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    router.push(`/projects?delete=${project.id}`)
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
              <Badge className={getStatusColor(project.status)}>
                {project.status}
              </Badge>
            </div>
          </div>
          <CardDescription className="line-clamp-2">
            {project.description || "No description"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(project.dueDate), "MMM d, yyyy")}</span>
            </div>
            {project.status === "ACTIVE" && (
              <span className={isUrgent ? "text-red-500 font-medium" : ""}>
                {daysLeft > 0 ? `${daysLeft} days left` : "Due today"}
              </span>
            )}
          </div>
          <div className="mt-4 flex items-center text-sm text-gray-500">
            <span>{project._count.tasks} tasks</span>
            <ArrowRight className="ml-auto h-4 w-4" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}