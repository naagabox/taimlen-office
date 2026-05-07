"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

interface PieChartData {
  name: string
  value: number
  fill: string
}

interface TaskPieChartProps {
  data: PieChartData[]
}

const COLORS = ["#22c55e", "#94a3b8", "#f59e0b"]

export function TaskPieChart({ data }: TaskPieChartProps) {
  const total = data.reduce((acc, item) => acc + item.value, 0)

  return (
    <div className="w-full">
      <h3 className="mb-4 text-lg font-semibold">Attachment Status</h3>
      <div className="h-[270px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex items-center justify-center gap-6">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: COLORS[index] }}
            />
            <span className="text-sm text-muted-foreground">
              {item.name} ({item.value})
            </span>
          </div>
        ))}
      </div>
      {total === 0 && (
        <p className="mt-4 text-center text-sm text-muted-foreground">No tasks found</p>
      )}
    </div>
  )
}