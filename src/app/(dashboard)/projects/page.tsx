import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { Prisma, TaskStatus } from "@prisma/client"
import { Suspense } from "react"
import { ProjectsList } from "@/components/project/projects-list"
import { Loader2 } from "lucide-react"

function getStartOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function getEndOfWeek(date: Date): Date {
  const start = getStartOfWeek(date)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return end
}

function getStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function getEndOfMonth(date: Date): Date {
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  end.setHours(23, 59, 59, 999)
  return end
}

export const dynamic = "force-dynamic"

type Props = {
  searchParams: Promise<{ edit?: string; delete?: string }>
}

export default async function ProjectsPage(props: Props) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return (
      <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
        <ProjectsList projects={[]} barChartData={[]} pieChartData={[]} searchParams={props.searchParams} />
      </Suspense>
    )
  }

  const projectWhereClause = {
    OR: [
      { userId: session.user.id },
      { members: { some: { userId: session.user.id } } },
    ],
  }

  const projects = await prisma.project.findMany({
    where: projectWhereClause,
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

  const startOfMonth = getStartOfMonth(new Date())
  const endOfMonth = getEndOfMonth(new Date())

  const tasksThisMonth = await prisma.task.groupBy({
    by: ["createdAt", "status"],
    where: {
      project: projectWhereClause,
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    _count: true,
  })

  const tasksToDo = await prisma.task.count({
    where: {
      project: projectWhereClause,
      status: TaskStatus.NOT_STARTED,
    },
  })

  const allProjectTasks = await prisma.task.findMany({
    where: { project: projectWhereClause },
    select: { attachments: true },
  })

  const tasksWithAttachment = allProjectTasks.filter(
    (task) => task.attachments !== null && Array.isArray(task.attachments) && (task.attachments as unknown[]).length > 0
  ).length

  const tasksWithoutAttachment = allProjectTasks.filter(
    (task) => task.attachments === null || (Array.isArray(task.attachments) && (task.attachments as unknown[]).length === 0)
  ).length

  const dayData: { [key: number]: { finished: number; inProgress: number; todo: number } } = {}

  for (const task of tasksThisMonth) {
    const taskDate = new Date(task.createdAt)
    const dateKey = taskDate.getDate()
    
    if (!dayData[dateKey]) {
      dayData[dateKey] = { finished: 0, inProgress: 0, todo: 0 }
    }
    
    if (task.status === TaskStatus.FINISHED) {
      dayData[dateKey].finished += task._count
    } else if (task.status === TaskStatus.IN_PROGRESS) {
      dayData[dateKey].inProgress += task._count
    } else if (task.status === TaskStatus.NOT_STARTED) {
      dayData[dateKey].todo += task._count
    }
  }

  const daysInMonth = endOfMonth.getDate()
  const barChartData = Array.from({ length: daysInMonth }, (_, i) => {
    const date = i + 1
    return {
      day: date.toString(),
      date: date,
      finished: dayData[date]?.finished || 0,
      inProgress: dayData[date]?.inProgress || 0,
      todo: dayData[date]?.todo || 0,
    }
  })

  const monthYear = startOfMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })

  const pieChartData = [
    { name: "Attached", value: tasksWithAttachment, fill: "#22c55e" },
    { name: "Not Yet", value: tasksWithoutAttachment, fill: "#94a3b8" },
    { name: "To Do", value: tasksToDo, fill: "#f59e0b" },
  ]

  const now = new Date()
  const serializedProjects = projects.map((project) => {
    const member = project.members[0]
    const isOwner = project.userId === session.user.id
    const canEdit = isOwner || member?.role === "EDITOR"
    const isOwnerOnly = project.userId === session.user.id
    const tasksFinished = project.tasks.filter(t => t.status === TaskStatus.FINISHED).length
    
    let currentStatus = project.status
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dueDateOnly = new Date(project.dueDate.getFullYear(), project.dueDate.getMonth(), project.dueDate.getDate())
    if (project.status === "ACTIVE" && dueDateOnly < today) {
      currentStatus = "OVERDUE"
    }
    
    return {
      ...project,
      status: currentStatus,
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

  return (
    <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <ProjectsList projects={serializedProjects} barChartData={barChartData} pieChartData={pieChartData} monthYear={monthYear} searchParams={props.searchParams} />
    </Suspense>
  )
}