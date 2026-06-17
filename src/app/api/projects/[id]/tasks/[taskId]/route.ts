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
    const { title, description, completed, status, order, attachments, dueDate, startDate, durationDays, leadName } = await request.json()

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
        ...(description !== undefined && { description }),
        ...(completed !== undefined && { completed }),
        ...(status && { status }),
        ...(order !== undefined && { order }),
        ...(attachments !== undefined && { attachments }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(durationDays !== undefined && { durationDays: durationDays ? parseInt(durationDays) : null }),
        ...(leadName !== undefined && { leadName }),
      },
    })

    // Log attachment changes
    if (attachments !== undefined && existingTask) {
      const oldAttachments: string[] = Array.isArray((existingTask as any).attachments) ? (existingTask as any).attachments : []
      const newAttachments: string[] = Array.isArray(attachments) ? attachments : []
      
      const added = newAttachments.filter(url => !oldAttachments.includes(url))
      const removed = oldAttachments.filter(url => !newAttachments.includes(url))
      
      for (const url of added) {
        const fileName = url.split('/').pop() || url
        await prisma.activityLog.create({
          data: {
            taskId: task.id,
            taskTitle: task.title,
            oldStatus: "",
            newStatus: `ATTACHMENT_ADDED: ${fileName}`,
            userId: session.user.id,
            userName: session.user.name || session.user.email || "Unknown",
            projectId: id,
          },
        })
      }
      
      for (const url of removed) {
        const fileName = url.split('/').pop() || url
        await prisma.activityLog.create({
          data: {
            taskId: task.id,
            taskTitle: task.title,
            oldStatus: `ATTACHMENT_REMOVED: ${fileName}`,
            newStatus: "",
            userId: session.user.id,
            userName: session.user.name || session.user.email || "Unknown",
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
          userName: session.user.name || session.user.email || "Unknown",
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
          userName: session.user.name || session.user.email || "Unknown",
          projectId: id,
        },
      })
    }

    // Log description change
    if (description !== undefined && existingTask && description !== existingTask.description) {
      const isNew = !existingTask.description
      await prisma.activityLog.create({
        data: {
          taskId: task.id,
          taskTitle: task.title,
          oldStatus: isNew ? "" : existingTask.description,
          newStatus: isNew ? `DESCRIPTION_ADDED: ${description}` : `DESCRIPTION_UPDATED: ${description}`,
          userId: session.user.id,
          userName: session.user.name || session.user.email || "Unknown",
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
        userName: session.user.name || session.user.email || "Unknown",
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