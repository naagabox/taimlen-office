import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "15")
    const offset = parseInt(searchParams.get("offset") || "0")

    const activities = await prisma.activityLog.findMany({
      where: { projectId: id },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    })

    const total = await prisma.activityLog.count({ where: { projectId: id } })

    return NextResponse.json({ activities, total })
  } catch (error) {
    console.error("Get activities error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}