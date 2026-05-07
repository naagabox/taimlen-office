import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { TaskStatus } from "@prisma/client"
import { ProjectsList } from "@/components/project/projects-list"

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

function getDayName(dayIndex: number): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  return days[dayIndex]
}

export const dynamic = "force-dynamic"

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return <ProjectsList projects={[]} barChartData={[]} pieChartData={[]} />
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

  const startOfWeek = getStartOfWeek(new Date())
  const endOfWeek = getEndOfWeek(new Date())

  const tasksThisWeek = await prisma.task.groupBy({
    by: ["createdAt", "status"],
    where: {
      project: projectWhereClause,
      createdAt: {
        gte: startOfWeek,
        lte: endOfWeek,
      },
    },
    _count: true,
  })

  const [tasksWithAttachment, tasksWithoutAttachment, tasksToDo] = await Promise.all([
    prisma.task.count({
      where: {
        project: projectWhereClause,
        attachmentUrl: { not: null },
      },
    }),
    prisma.task.count({
      where: {
        project: projectWhereClause,
        attachmentUrl: null,
      },
    }),
    prisma.task.count({
      where: {
        project: projectWhereClause,
        status: TaskStatus.NOT_STARTED,
      },
    }),
  ])

  const dayData: { [key: string]: { finished: number; inProgress: number; todo: number } } = {
    Mon: { finished: 0, inProgress: 0, todo: 0 },
    Tue: { finished: 0, inProgress: 0, todo: 0 },
    Wed: { finished: 0, inProgress: 0, todo: 0 },
    Thu: { finished: 0, inProgress: 0, todo: 0 },
    Fri: { finished: 0, inProgress: 0, todo: 0 },
    Sat: { finished: 0, inProgress: 0, todo: 0 },
    Sun: { finished: 0, inProgress: 0, todo: 0 },
  }

  for (const task of tasksThisWeek) {
    const taskDate = new Date(task.createdAt)
    const dayName = getDayName(taskDate.getDay())
    
    if (dayName in dayData) {
      if (task.status === TaskStatus.FINISHED) {
        dayData[dayName].finished += task._count
      } else if (task.status === TaskStatus.IN_PROGRESS) {
        dayData[dayName].inProgress += task._count
      } else if (task.status === TaskStatus.NOT_STARTED) {
        dayData[dayName].todo += task._count
      }
    }
  }

  const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const getDateForDay = (dayName: string): number => {
    const dayIndex = dayOrder.indexOf(dayName)
    const date = new Date(startOfWeek)
    date.setDate(date.getDate() + dayIndex)
    return date.getDate()
  }
  const monthYear = startOfWeek.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  
  const barChartData = dayOrder.map((day) => ({
    day,
    date: getDateForDay(day),
    finished: dayData[day].finished,
    inProgress: dayData[day].inProgress,
    todo: dayData[day].todo,
  }))

  const pieChartData = [
    { name: "Attached", value: tasksWithAttachment, fill: "#22c55e" },
    { name: "Not Attached", value: tasksWithoutAttachment, fill: "#94a3b8" },
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

  return <ProjectsList projects={serializedProjects} barChartData={barChartData} pieChartData={pieChartData} monthYear={monthYear} />
}