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
    const { title, completed, status, order, attachmentUrl } = await request.json()

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
    
    let oldStatus = existingTask?.status || null
    let newStatus = status

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(title && { title }),
        ...(completed !== undefined && { completed }),
        ...(status && { status }),
        ...(order !== undefined && { order }),
        ...(attachmentUrl !== undefined && { attachmentUrl }),
      },
    })

    // Log attachment change
    if (attachmentUrl !== undefined && existingTask && attachmentUrl !== existingTask.attachmentUrl) {
      const oldFileName = existingTask.attachmentUrl ? existingTask.attachmentUrl.split('/').pop() : null
      const newFileName = attachmentUrl ? attachmentUrl.split('/').pop() : null
      
      if (oldFileName !== newFileName) {
        await prisma.activityLog.create({
          data: {
            taskId: task.id,
            taskTitle: task.title,
            oldStatus: oldFileName ? `Removed: ${oldFileName}` : "No attachment",
            newStatus: newFileName ? `Added: ${newFileName}` : "Removed attachment",
            userId: session.user.id,
            userName: session.user.name || session.user.email,
            projectId: id,
          },
        })
      }
    }

    if (status && status !== oldStatus) {
      await prisma.activityLog.create({
        data: {
          taskId: task.id,
          taskTitle: task.title,
          oldStatus,
          newStatus: status,
          userId: session.user.id,
          userName: session.user.name || session.user.email,
          projectId: id,
        },
      })
    }

    // Log title change
    if (title && existingTask && title !== existingTask.title) {
      await prisma.activityLog.create({
        data: {
          taskId: task.id,
          taskTitle: title,
          oldStatus: existingTask.title,
          newStatus: "TITLE_UPDATED",
          userId: session.user.id,
          userName: session.user.name || session.user.email,
          projectId: id,
        },
      })
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error("Update task error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, taskId } = await params

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

    const task = await prisma.task.findUnique({ where: { id: taskId } })
    
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    await prisma.activityLog.create({
      data: {
        taskId: task.id,
        taskTitle: task.title,
        oldStatus: task.status,
        newStatus: "DELETED",
        userId: session.user.id,
        userName: session.user.name || session.user.email,
        projectId: id,
      },
    })

    await prisma.task.delete({ where: { id: taskId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete task error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}