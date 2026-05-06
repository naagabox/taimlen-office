import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId, email, role } = await request.json()

    if (!projectId || !email || !role) {
      return NextResponse.json(
        { error: "Project ID, email, and role are required" },
        { status: 400 }
      )
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project || project.userId !== session.user.id) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId: user.id },
      },
    })

    if (existingMember) {
      return NextResponse.json({ error: "User is already a member" }, { status: 400 })
    }

    const member = await prisma.projectMember.create({
      data: {
        projectId,
        userId: user.id,
        role,
      },
      include: {
        user: { select: { name: true, email: true, image: true } },
      },
    })

    return NextResponse.json(member)
  } catch (error) {
    console.error("Invite member error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}