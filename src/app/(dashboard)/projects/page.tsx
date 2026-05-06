import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { TaskStatus } from "@prisma/client"
import { ProjectsList } from "@/components/project/projects-list"

export const dynamic = "force-dynamic"

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return <ProjectsList projects={[]} />
  }

  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { userId: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
    include: {
      user: { select: { name: true, email: true } },
      members: { 
        include: { user: { select: { name: true, email: true } } },
        where: { userId: session.user.id },
        take: 1,
      },
      tasks: { select: { status: true } },
      _count: { select: { tasks: true } },
    },
    orderBy: { dueDate: "asc" },
  })

  const serializedProjects = projects.map((project) => {
    const member = project.members[0]
    const isOwner = project.userId === session.user.id
    const canEdit = isOwner || member?.role === "EDITOR"
    const isOwnerOnly = project.userId === session.user.id
    const tasksFinished = project.tasks.filter(t => t.status === TaskStatus.FINISHED).length
    
    return {
      ...project,
      dueDate: project.dueDate.toISOString(),
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      currentUserRole: isOwner ? "OWNER" : member?.role || null,
      canEdit,
      isOwnerOnly,
      tasks: undefined,
      _count: {
        tasks: project._count.tasks,
        tasksFinished,
      },
    }
  })

  return <ProjectsList projects={serializedProjects} />
}