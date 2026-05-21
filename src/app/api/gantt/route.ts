import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { TaskStatus } from "@prisma/client"

function getProgress(status: string): number {
  switch (status) {
    case "FINISHED": return 100
    case "IN_PROGRESS": return 50
    default: return 0
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          { members: { some: { userId: session.user.id } } },
        ],
      },
      include: {
        tasks: {
          where: { startDate: { not: null } },
          orderBy: { startDate: "asc" },
        },
      },
      orderBy: { dueDate: "asc" },
    })

    const ganttTasks = projects.flatMap(project =>
      project.tasks.map(task => ({
        id: task.id,
        projectId: project.id,
        phase: project.name,
        task: task.title,
        lead: task.leadName || "",
        progress: getProgress(task.status),
        start: task.startDate ? task.startDate.toISOString().slice(0, 10) : "",
        days: task.durationDays || 1,
      }))
    )

    return NextResponse.json(ganttTasks)
  } catch (error) {
    console.error("Get gantt error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId, title, startDate, durationDays, leadName } = await request.json()

    if (!projectId || !title || !startDate) {
      return NextResponse.json(
        { error: "projectId, title, and startDate are required" },
        { status: 400 }
      )
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
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
        projectId,
        title,
        startDate: new Date(startDate),
        durationDays: durationDays ? parseInt(durationDays) : 1,
        leadName,
        status: "NOT_STARTED",
        order: 0,
      },
    })

    return NextResponse.json({
      id: task.id,
      projectId: project.id,
      phase: project.name,
      task: task.title,
      lead: task.leadName || "",
      progress: 0,
      start: task.startDate ? task.startDate.toISOString().slice(0, 10) : "",
      days: task.durationDays || 1,
    })
  } catch (error) {
    console.error("Create gantt task error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, title, startDate, durationDays, leadName } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: { project: true },
    })

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const project = existingTask.project
    const isOwner = project.userId === session.user.id
    const member = await prisma.projectMember.findFirst({
      where: { projectId: project.id, userId: session.user.id },
    })
    const canEdit = isOwner || member?.role === "EDITOR"

    if (!canEdit) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(durationDays !== undefined && { durationDays: durationDays ? parseInt(durationDays) : null }),
        ...(leadName !== undefined && { leadName }),
      },
      include: { project: true },
    })

    return NextResponse.json({
      id: task.id,
      projectId: task.project.id,
      phase: task.project.name,
      task: task.title,
      lead: task.leadName || "",
      progress: getProgress(task.status),
      start: task.startDate ? task.startDate.toISOString().slice(0, 10) : "",
      days: task.durationDays || 1,
    })
  } catch (error) {
    console.error("Update gantt task error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: { project: true },
    })

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const project = existingTask.project
    const isOwner = project.userId === session.user.id
    const member = await prisma.projectMember.findFirst({
      where: { projectId: project.id, userId: session.user.id },
    })
    const canEdit = isOwner || member?.role === "EDITOR"

    if (!canEdit) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.task.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete gantt task error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}
