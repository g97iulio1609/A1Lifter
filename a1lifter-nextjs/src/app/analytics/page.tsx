"use client"

import { useMemo } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useDashboardStats } from "@/hooks/api/use-dashboard"
import { useEvents } from "@/hooks/api/use-events"
import { useTopLifters } from "@/hooks/api/use-analytics"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BarChart3,
  Users,
  Award,
  Activity,
  ArrowLeft,
  Loader2,
  Download,
  FileDown,
} from "lucide-react"
import { exportDashboardStats, exportTopLifters, exportEvents, exportToPDF } from "@/lib/export"

export default function AnalyticsPage() {
  const { data: session } = useSession()
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: events, isLoading: eventsLoading } = useEvents()
  const { data: topLifters, isLoading: topLiftersLoading } = useTopLifters(5)

  const highlightedEvent = useMemo(() => {
    if (!events || events.length === 0) return null
    return events[0]
  }, [events])

  const averageRegistrations = useMemo(() => {
    if (!events || events.length === 0) return 0

    const totalRegistrations = events.reduce((total, event) => {
      const augmented = event as unknown as { _count?: { registrations: number } }
      const fallbackCount = Array.isArray(event.registrations) ? event.registrations.length : 0
      return total + (augmented._count?.registrations ?? fallbackCount)
    }, 0)

    return totalRegistrations / events.length
  }, [events])

  const approvalRate = useMemo(() => {
    if (!stats || !events || events.length === 0) return 0
    const denominator = Math.max(1, stats.totalAthletes ?? 1)
    return Math.min(100, Math.round(((stats.todayResults ?? 0) / denominator) * 100))
  }, [stats, events])

  if (!session) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Please sign in to view analytics</h1>
          <Link href="/auth/signin">
            <Button className="mt-4">Sign in</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "ORGANIZER") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Access denied</h1>
          <p className="mt-2 text-gray-600">Only organizers and admins can view analytics.</p>
          <Link href="/dashboard">
            <Button className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="mt-2 text-gray-600">Realtime KPIs for competitions, athletes, and records.</p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total athletes</CardTitle>
              <Users className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              ) : (
                <p className="text-3xl font-semibold text-gray-900">{stats?.totalAthletes ?? 0}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active competitions</CardTitle>
              <Activity className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              ) : (
                <p className="text-3xl font-semibold text-gray-900">{stats?.activeCompetitions ?? 0}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Results today</CardTitle>
              <Award className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              ) : (
                <p className="text-3xl font-semibold text-gray-900">{stats?.todayResults ?? 0}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Records this week</CardTitle>
              <BarChart3 className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              ) : (
                <p className="text-3xl font-semibold text-gray-900">{stats?.recordsBroken ?? 0}</p>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Highlighted event</CardTitle>
              <CardDescription>Latest competition insights.</CardDescription>
            </CardHeader>
            <CardContent>
              {eventsLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                </div>
              ) : !highlightedEvent ? (
                <p className="text-sm text-gray-500">No competitions scheduled yet.</p>
              ) : (
                <div className="space-y-4 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">{highlightedEvent.name}</span>
                    <Badge variant="secondary">{highlightedEvent.status.replaceAll("_", " ")}</Badge>
                  </div>
                  <p>{highlightedEvent.description || "No description available."}</p>
                  <div className="text-xs uppercase tracking-widest text-gray-500">Categories</div>
                  <div className="flex flex-wrap gap-2">
                    {highlightedEvent.categories.map((category) => (
                      <Badge key={category.id} variant="outline" className="text-xs">
                        {category.name}
                      </Badge>
                    ))}
                  </div>
                  <Link href={`/events/${highlightedEvent.id}`} className="text-sm font-medium text-indigo-600 hover:underline">
                    View full report
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Realtime KPI summary</CardTitle>
              <CardDescription>Snapshot of platform health.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-center justify-between">
                  <span>Average registrations per event</span>
                  <span className="font-semibold text-gray-900">
                    {averageRegistrations.toFixed(1)}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Approval conversion</span>
                  <span className="font-semibold text-gray-900">{approvalRate}%</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Live competitions</span>
                  <span className="font-semibold text-gray-900">{stats?.activeCompetitions ?? 0}</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>

        <section className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Top Sinclair Performers</CardTitle>
              <CardDescription>Leaders across all events by Sinclair points.</CardDescription>
            </CardHeader>
            <CardContent>
              {topLiftersLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                </div>
              ) : !topLifters || topLifters.length === 0 ? (
                <p className="text-sm text-gray-500">No lifts recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Rank</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Athlete</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Event</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Total (kg)</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Sinclair coeff.</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {topLifters.map((lifter, index) => (
                        <tr key={`${lifter.userId}-${lifter.eventId}`}>
                          <td className="px-3 py-2 font-semibold text-gray-700">#{index + 1}</td>
                          <td className="px-3 py-2 text-gray-700">{lifter.userName}</td>
                          <td className="px-3 py-2 text-gray-700">{lifter.eventName}</td>
                          <td className="px-3 py-2 text-gray-700">{lifter.total.toFixed(1)}</td>
                          <td className="px-3 py-2 text-gray-700">{lifter.sinclair !== null ? lifter.sinclair.toFixed(3) : "—"}</td>
                          <td className="px-3 py-2 text-gray-700">{lifter.points !== null ? lifter.points.toFixed(2) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}
