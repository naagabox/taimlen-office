"use client"

import { TaskBarChart } from "./task-bar-chart"
import { TaskPieChart } from "./task-pie-chart"

interface BarChartData {
  day: string
  date: number
  finished: number
  inProgress: number
  todo: number
}

interface PieChartData {
  name: string
  value: number
  fill: string
}

interface ChartsSectionProps {
  barChartData: BarChartData[]
  pieChartData: PieChartData[]
  monthYear?: string
}

export function ChartsSection({ barChartData, pieChartData, monthYear }: ChartsSectionProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-10">
      <div className="col-span-6 rounded-lg border bg-card p-4 shadow-sm">
        <TaskBarChart data={barChartData} monthYear={monthYear} />
      </div>
      <div className="col-span-4 rounded-lg border bg-card p-4 shadow-sm">
        <TaskPieChart data={pieChartData} />
      </div>
    </div>
  )
}