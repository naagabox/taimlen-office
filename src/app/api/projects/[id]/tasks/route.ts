import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { title, description, dueDate } = await request.json()

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: { members: true },
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const isOwner = project.userId === session.user.id
    const member = project.members.find((m) => m.userId === session.user.id)
    const canEdit = isOwner || member?.role === "EDITOR"

    if (!canEdit) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const task = await prisma.task.create({
      data: {
        projectId: id,
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: "NOT_STARTED",
        order: 0,
      },
    })

    await prisma.activityLog.create({
      data: {
        taskId: task.id,
        taskTitle: task.title,
        oldStatus: null,
        newStatus: "NOT_STARTED",
        userId: session.user.id,
        userName: session.user.name || session.user.email,
        projectId: id,
      },
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error("Create task error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}