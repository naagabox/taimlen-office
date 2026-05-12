"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface BarChartData {
  day: string
  date: number
  finished: number
  inProgress: number
  todo: number
}

interface TaskBarChartProps {
  data: BarChartData[]
  monthYear?: string
}

const chartConfig: ChartConfig = {
  finished: {
    label: "Finished",
    color: "hsl(142, 76%, 36%)",
  },
  inProgress: {
    label: "In Progress",
    color: "hsl(221, 83%, 53%)",
  },
  todo: {
    label: "To Do",
    color: "hsl(215, 20%, 65%)",
  },
}

export function TaskBarChart({ data, monthYear }: TaskBarChartProps) {
  const totalTasks = data.reduce(
    (acc, day) => acc + day.finished + day.inProgress + day.todo,
    0
  )

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Task Distribution This Month</h3>
        {monthYear && (
          <span className="text-sm text-muted-foreground">{monthYear}</span>
        )}
      </div>
      <ChartContainer config={chartConfig} className="h-[288px] w-full">
        <BarChart data={data} stackOffset="sign" barSize={16} margin={{ top: 10, right: 20, bottom: 30, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="date"
            type="number"
            domain={[1, 31]}
            tickLine={false}
            tickMargin={6}
            axisLine={false}
            className="text-[10px] fill-muted-foreground"
            tickCount={31}
            interval={0}
          />
          <YAxis
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            className="text-xs fill-muted-foreground"
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Bar
            dataKey="finished"
            stackId="a"
            fill="var(--color-finished)"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="inProgress"
            stackId="a"
            fill="var(--color-inProgress)"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="todo"
            stackId="a"
            fill="var(--color-todo)"
            radius={[0, 0, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
      <div className="mt-[-5px] flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-green-600" />
          <span className="text-sm text-muted-foreground">Finished ({data.reduce((acc, d) => acc + d.finished, 0)})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-blue-600" />
          <span className="text-sm text-muted-foreground">In Progress ({data.reduce((acc, d) => acc + d.inProgress, 0)})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-gray-400" />
          <span className="text-sm text-muted-foreground">To Do ({data.reduce((acc, d) => acc + d.todo, 0)})</span>
        </div>
      </div>
      {totalTasks === 0 && (
        <p className="mt-4 text-center text-sm text-muted-foreground">No tasks this month</p>
      )}
    </div>
  )
}