"use client"

import { useRef } from "react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js"
import { Bar, Pie, Line } from "react-chartjs-2"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement)

interface PullRequest {
  id: number
  title: string
  state: string
  created_on: string
  merged_on?: string
  comments: number
  commits: number
  link: string
  target_branch?: string
  days_to_merge?: number
  merged_by?: string
}

interface ReportChartsProps {
  prs: PullRequest[]
}

export function ReportCharts({ prs }: ReportChartsProps) {
  const pieChartRef = useRef<ChartJS<"pie">>(null)
  const barChartRef = useRef<ChartJS<"bar">>(null)
  const lineChartRef = useRef<ChartJS<"line">>(null)

  // PR State Distribution (Pie Chart)
  const stateData = {
    merged: prs.filter((pr) => pr.state === "MERGED").length,
    open: prs.filter((pr) => pr.state === "OPEN").length,
    declined: prs.filter((pr) => pr.state === "DECLINED").length,
  }

  const pieData = {
    labels: ["Merged", "Open", "Declined"],
    datasets: [
      {
        data: [stateData.merged, stateData.open, stateData.declined],
        backgroundColor: ["#10B981", "#6B7280", "#EF4444"],
        borderColor: ["#059669", "#4B5563", "#DC2626"],
        borderWidth: 2,
      },
    ],
  }

  // Commits per PR (Bar Chart)
  const barData = {
    labels: prs.slice(0, 10).map((pr) => pr.title.substring(0, 20) + "..."),
    datasets: [
      {
        label: "Commits",
        data: prs.slice(0, 10).map((pr) => pr.commits),
        backgroundColor: "#3B82F6",
        borderColor: "#2563EB",
        borderWidth: 1,
      },
    ],
  }

  // Days to Merge (Line Chart)
  const mergedPRs = prs.filter((pr) => pr.state === "MERGED" && pr.days_to_merge !== undefined)
  const lineData = {
    labels: mergedPRs.slice(0, 10).map((_, index) => `PR ${index + 1}`),
    datasets: [
      {
        label: "Days to Merge",
        data: mergedPRs.slice(0, 10).map((pr) => pr.days_to_merge || 0),
        borderColor: "#F59E0B",
        backgroundColor: "rgba(245, 158, 11, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
  }

  return (
    <div className="flex lg:flex-row flex-col gap-8 py-8">
      <div id="pie-chart" className="w-96 h-96">
        <h3 className="text-lg font-semibold mb-4">PR State Distribution</h3>
        <Pie ref={pieChartRef} data={pieData} options={chartOptions} />
      </div>

      <div id="bar-chart" className="w-96 h-96">
        <h3 className="text-lg font-semibold mb-4">Commits per PR</h3>
        <Bar ref={barChartRef} data={barData} options={chartOptions} />
      </div>

      <div id="line-chart" className="w-96 h-96">
        <h3 className="text-lg font-semibold mb-4">Days to Merge Timeline</h3>
        <Line ref={lineChartRef} data={lineData} options={chartOptions} />
      </div>
    </div>
  )
}
