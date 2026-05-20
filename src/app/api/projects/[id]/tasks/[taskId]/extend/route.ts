import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, taskId } = await params
    const { dueDate } = await request.json()

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

    const existingTask = await prisma.task.findUnique({ where: { id: taskId } })
    
    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const oldDueDate = existingTask.dueDate
    const newDueDate = new Date(dueDate)

    const task = await prisma.task.update({
      where: { id: taskId },
      data: { dueDate: newDueDate },
    })

    await prisma.activityLog.create({
      data: {
        taskId: task.id,
        taskTitle: task.title,
        oldStatus: oldDueDate ? `EXTENDED_FROM: ${oldDueDate.toISOString().split("T")[0]}` : "EXTENDED_FROM: null",
        newStatus: `EXTENDED_TO: ${dueDate}`,
        userId: session.user.id,
        userName: session.user.name || session.user.email || "Unknown",
        projectId: id,
      },
    })

    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const overdueTasks = await prisma.task.findMany({
      where: {
        projectId: id,
        dueDate: {
          not: null,
          lt: now,
        },
      },
    })

    const newProjectStatus = overdueTasks.length > 0 ? "OVERDUE" : "ACTIVE"

    if (project.status !== newProjectStatus) {
      await prisma.project.update({
        where: { id },
        data: { status: newProjectStatus },
      })

      await prisma.activityLog.create({
        data: {
          taskId: task.id,
          taskTitle: `[Project] ${project.name}`,
          oldStatus: project.status,
          newStatus: newProjectStatus,
          userId: session.user.id,
          userName: session.user.name || session.user.email || "Unknown",
          projectId: id,
        },
      })
    }

    return NextResponse.json({ task, projectStatus: newProjectStatus })
  } catch (error) {
    console.error("Extend task error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}