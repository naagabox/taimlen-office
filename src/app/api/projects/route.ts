import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { TaskStatus } from "@prisma/client"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description, dueDate } = await request.json()

    if (!name || !dueDate) {
      return NextResponse.json(
        { error: "Name and due date are required" },
        { status: 400 }
      )
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        dueDate: new Date(dueDate),
        userId: session.user.id,
      },
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error("Create project error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
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
        user: { select: { name: true, email: true } },
        members: { include: { user: { select: { name: true, email: true } } } },
        tasks: { 
          select: { status: true, createdAt: true }
        },
        _count: { select: { tasks: true } },
      },
      orderBy: { dueDate: "asc" },
    })

    const projectsWithTaskCounts = projects.map(project => ({
      ...project,
      tasks: undefined,
      _count: {
        tasks: project._count.tasks,
        tasksFinished: project.tasks.filter(t => t.status === TaskStatus.FINISHED).length,
      },
    }))

    return NextResponse.json(projectsWithTaskCounts)
  } catch (error) {
    console.error("Get projects error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}