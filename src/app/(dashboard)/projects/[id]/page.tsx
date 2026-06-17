import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { ProjectDetail } from "@/components/project/project-detail"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ id: string }>
}

export default async function ProjectPage({ params }: Props) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    notFound()
  }

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, image: true } },
      members: {
        include: { user: { select: { name: true, email: true, image: true } } },
      },
      tasks: { orderBy: { order: "asc" } },
    },
  })

  if (!project) {
    return notFound()
  }

  const serializedProject = {
    ...project,
    dueDate: project.dueDate.toISOString(),
    createdAt: project.createdAt.toISOString(),
    tasks: project.tasks.map((task: any) => {
      let attachments: string[] | null = null
      if (task.attachments && Array.isArray(task.attachments)) {
        attachments = task.attachments as string[]
      } else if (task.attachmentUrl) {
        attachments = [task.attachmentUrl]
      }
      return {
        ...task,
        status: task.status,
        order: task.order,
        dueDate: task.dueDate?.toISOString() || null,
        attachments,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
      }
    }),
  }

  const isOwner = project.userId === session.user.id
  const member = project.members.find((m: { userId: string }) => m.userId === session.user.id)
  const canEdit = isOwner || member?.role === "EDITOR" || member?.role === "OWNER"

  return <ProjectDetail project={serializedProject} canEdit={canEdit} />
}