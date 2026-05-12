"use client"

import Chart from "react-apexcharts"

interface PieChartData {
  name: string
  value: number
  fill: string
}

interface TaskPieChartProps {
  data: PieChartData[]
}

const colorMap: Record<string, string> = {
  "Attached": "#22c55e",
  "Not Yet": "#94a3b8",
  "To Do": "#f59e0b",
}

const CHART_COLORS = ["#22c55e", "#94a3b8", "#f59e0b"]

export function TaskPieChart({ data }: TaskPieChartProps) {
  const total = data.reduce((acc, item) => acc + item.value, 0)

  const options: ApexCharts.ApexOptions = {
    chart: {
      id: "attachment-status",
      toolbar: { show: false },
      fontFamily: "inherit",
      sparkline: { enabled: false },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 0,
        borderRadiusApplication: "end",
        barHeight: "50%",
        distributed: true,
      },
    },
    colors: CHART_COLORS,
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories: data.map(item => item.name),
      labels: {
        style: {
          colors: "hsl(215.4 16.3% 56.9%)",
          fontSize: "12px",
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
      tickAmount: 5,
    },
    yaxis: {
      labels: {
        style: {
          colors: "hsl(215.4 16.3% 56.9%)",
          fontSize: "12px",
        },
      },
    },
    grid: {
      borderColor: "hsl(214.3 31.8% 91.4%)",
      strokeDashArray: 4,
      xaxis: {
        lines: {
          show: true,
        },
      },
      yaxis: {
        lines: {
          show: false,
        },
      },
    },
    tooltip: {
      theme: "light",
      y: {
        formatter: (val: number) => `${val} tasks`,
      },
    },
    legend: {
      show: false,
    },
    states: {
      hover: {
        filter: {
          type: "none",
        },
      },
      active: {
        filter: {
          type: "none",
        },
      },
    },
  }

  const series = [{
    name: "Tasks",
    data: data.map(item => item.value),
  }]

  return (
    <div className="w-full">
      <h3 className="mb-4 text-lg font-semibold">Attachment Evidences</h3>
      <div className="h-[270px] w-full">
        <Chart
          options={options}
          series={series}
          type="bar"
          height={270}
          width="100%"
        />
      </div>
      <div className="mt-4 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-green-500" />
          <span className="text-sm text-muted-foreground">Attached ({data.find(d => d.name === "Attached")?.value || 0})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-gray-400" />
          <span className="text-sm text-muted-foreground">Not Yet ({data.find(d => d.name === "Not Yet")?.value || 0})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-amber-500" />
          <span className="text-sm text-muted-foreground">To Do ({data.find(d => d.name === "To Do")?.value || 0})</span>
        </div>
      </div>
      {total === 0 && (
        <p className="mt-4 text-center text-sm text-muted-foreground">No tasks found</p>
      )}
    </div>
  )
}