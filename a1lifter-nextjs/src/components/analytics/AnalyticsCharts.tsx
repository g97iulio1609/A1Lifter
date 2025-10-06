"use client"

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js"
import { Line, Bar, Doughnut } from "react-chartjs-2"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface AnalyticsChartsProps {
  data?: {
    performanceData?: {
      labels: string[]
      datasets: {
        label: string
        data: number[]
        borderColor: string
        backgroundColor: string
      }[]
    }
    categoryDistribution?: {
      labels: string[]
      data: number[]
    }
    attemptResults?: {
      labels: string[]
      data: number[]
    }
  }
}

export function AnalyticsCharts({ data }: AnalyticsChartsProps) {
  const performanceData = data?.performanceData || {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Total Lifts",
        data: [65, 78, 90, 81, 96, 105],
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.5)",
      },
      {
        label: "Successful Lifts",
        data: [60, 72, 85, 75, 88, 98],
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.5)",
      },
    ],
  }

  const categoryData = {
    labels: data?.categoryDistribution?.labels || ["Powerlifting", "Weightlifting", "Strongman"],
    datasets: [
      {
        data: data?.categoryDistribution?.data || [40, 35, 25],
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)",
          "rgba(34, 197, 94, 0.8)",
          "rgba(251, 146, 60, 0.8)",
        ],
        borderWidth: 1,
      },
    ],
  }

  const resultsData = {
    labels: data?.attemptResults?.labels || ["Good", "No Lift", "Disqualified", "Pending"],
    datasets: [
      {
        label: "Attempt Results",
        data: data?.attemptResults?.data || [120, 30, 5, 10],
        backgroundColor: [
          "rgba(34, 197, 94, 0.8)",
          "rgba(239, 68, 68, 0.8)",
          "rgba(251, 146, 60, 0.8)",
          "rgba(156, 163, 175, 0.8)",
        ],
      },
    ],
  }

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
      },
    },
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Over Time</CardTitle>
              <CardDescription>Track your lifting progress month by month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <Line data={performanceData} options={lineOptions} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <Card>
            <CardHeader>
              <CardTitle>Category Distribution</CardTitle>
              <CardDescription>Breakdown of athletes by sport category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center">
                <div className="w-full max-w-md">
                  <Doughnut data={categoryData} options={doughnutOptions} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>Attempt Results</CardTitle>
              <CardDescription>Distribution of all attempt outcomes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <Bar
                  data={resultsData}
                  options={{
                    ...lineOptions,
                    plugins: {
                      ...lineOptions.plugins,
                      legend: {
                        display: false,
                      },
                    },
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
