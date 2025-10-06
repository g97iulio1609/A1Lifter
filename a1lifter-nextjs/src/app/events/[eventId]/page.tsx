"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { useEvent } from "@/hooks/api/use-events"
import { useRegistrations, useApproveRegistration, useRejectRegistration } from "@/hooks/api/use-registrations"
import { useAttempts, useDeleteAttempt, useLeaderboard, LeaderboardEntry } from "@/hooks/api/use-attempts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RegisterAthleteDialog } from "@/components/admin/RegisterAthleteDialog"
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Users,
  Edit,
  Loader2,
  CheckCircle2,
  XCircle,
  ClipboardList,
  Trash2,
  Trophy,
} from "lucide-react"
import { toast } from "sonner"

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
  IN_PROGRESS: "default",
  REGISTRATION_OPEN: "default",
  REGISTRATION_CLOSED: "secondary",
  PLANNED: "secondary",
  COMPLETED: "outline",
  CANCELLED: "outline",
}

const TABS = ["overview", "registrations", "attempts", "leaderboard"] as const

type ActiveTab = (typeof TABS)[number]

export default function EventDetailPage() {
  const params = useParams<{ eventId: string }>()
  const eventId = params.eventId
  const router = useRouter()
  const { data: session } = useSession()

  const [activeTab, setActiveTab] = useState<ActiveTab>("overview")
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL")

  const { data: event, isLoading: eventLoading } = useEvent(eventId)
  const { data: registrations, isLoading: registrationsLoading } = useRegistrations(eventId)
  const { data: attempts, isLoading: attemptsLoading } = useAttempts(eventId)
  const deleteAttempt = useDeleteAttempt()
  const approveRegistration = useApproveRegistration()
  const rejectRegistration = useRejectRegistration()

  const categoryFilter = selectedCategory === "ALL" ? undefined : selectedCategory
  const { data: leaderboard, isLoading: leaderboardLoading } = useLeaderboard(eventId, categoryFilter)

  if (!session) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Please sign in to view this event</h1>
          <p className="mt-2 text-gray-600">Authentication is required to access event details.</p>
          <Button className="mt-4" asChild>
            <Link href="/auth/signin">Sign in</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (eventLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Event not found</h1>
          <p className="mt-2 text-gray-600">The event you are trying to access does not exist.</p>
          <Button className="mt-4" asChild>
            <Link href="/events">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to events
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const registrationCount = registrations?.length ?? 0
  const approvedCount = registrations?.filter((registration) => registration.status === "APPROVED").length ?? 0
  const pendingCount = registrations?.filter((registration) => registration.status === "PENDING").length ?? 0
  const attemptCount = attempts?.length ?? 0

  const handleApprove = async (registrationId: string) => {
    try {
      await approveRegistration.mutateAsync(registrationId)
      toast.success("Registration approved")
    } catch (error) {
      console.error(error)
      toast.error("Unable to approve registration")
    }
  }

  const handleReject = async (registrationId: string) => {
    try {
      await rejectRegistration.mutateAsync(registrationId)
      toast.success("Registration rejected")
    } catch (error) {
      console.error(error)
      toast.error("Unable to reject registration")
    }
  }

  const handleDeleteAttempt = async (attemptId: string) => {
    const confirmed = window.confirm("Delete this attempt?")
    if (!confirmed) return

    try {
      await deleteAttempt.mutateAsync(attemptId)
      toast.success("Attempt deleted")
    } catch (error) {
      console.error(error)
      toast.error("Unable to delete attempt")
    }
  }

  const formatDateRange = (startDate: string | Date, endDate: string | Date) => {
    const formatter = new Intl.DateTimeFormat(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

    return `${formatter.format(new Date(startDate))} → ${formatter.format(new Date(endDate))}`
  }

  const canManageRegistrations = session.user.role === "ADMIN" || session.user.role === "ORGANIZER"
  const canManageAttempts = canManageRegistrations || session.user.role === "JUDGE"

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={STATUS_VARIANTS[event.status] ?? "secondary"}>{event.status.replaceAll("_", " ")}</Badge>
              <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
            </div>
            <p className="mt-2 max-w-2xl text-gray-600">{event.description || "No description provided"}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            {(session.user.role === "ADMIN" || session.user.role === "ORGANIZER") && (
              <Button asChild>
                <Link href={`/events/${event.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit event
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
              <CardDescription>Competition timeline</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                <span>{formatDateRange(event.startDate, event.endDate)}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{event.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Organizer: {event.organizer?.name || event.organizer?.email}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Registrations</CardTitle>
              <CardDescription>Current pipeline</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Total</span>
                <span className="font-semibold">{registrationCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-green-600">
                <span>Approved</span>
                <span className="font-semibold">{approvedCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-amber-600">
                <span>Pending</span>
                <span className="font-semibold">{pendingCount}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Attempts</CardTitle>
              <CardDescription>Recorded lifts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Total attempts</span>
                <span className="font-semibold">{attemptCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-indigo-600">
                <span>Categories</span>
                <span className="font-semibold">{event.categories.length}</span>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {TABS.map((tab) => (
                <Button
                  key={tab}
                  variant={activeTab === tab ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab(tab)}
                  className="capitalize"
                >
                  {tab}
                </Button>
              ))}
            </div>
            {activeTab === "leaderboard" && event.categories.length > 0 && (
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All categories</SelectItem>
                  {event.categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="mt-6">
            {activeTab === "overview" && (
              <Card>
                <CardHeader>
                  <CardTitle>Competition overview</CardTitle>
                  <CardDescription>Categories and structure</CardDescription>
                </CardHeader>
                <CardContent>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Categories</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {event.categories.length === 0 ? (
                      <p className="text-sm text-gray-500">No categories defined yet.</p>
                    ) : (
                      event.categories.map((category) => (
                        <Badge key={category.id} variant="outline" className="text-xs">
                          {category.name}
                        </Badge>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "registrations" && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Registrations</CardTitle>
                      <CardDescription>Approve or reject participant entries</CardDescription>
                    </div>
                    {canManageRegistrations && event.categories.length > 0 && (
                      <RegisterAthleteDialog
                        eventId={event.id}
                        categories={event.categories}
                        onSuccess={() => window.location.reload()}
                      />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {registrationsLoading ? (
                    <div className="flex h-40 items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                    </div>
                  ) : registrationCount === 0 ? (
                    <div className="flex h-40 items-center justify-center text-sm text-gray-500">
                      No registrations yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Athlete</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Category</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Weight</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {registrations?.map((registration) => {
                            const meta = registration as unknown as { bodyWeight?: number }

                            return (
                              <tr key={registration.id}>
                                <td className="px-4 py-3">
                                  <div className="font-medium text-gray-900">{registration.user.name || registration.user.email}</div>
                                  <div className="text-xs text-gray-500">{registration.user.email}</div>
                                </td>
                                <td className="px-4 py-3 text-gray-700">{registration.category.name}</td>
                                <td className="px-4 py-3">
                                  <Badge
                                    variant={
                                      registration.status === "APPROVED"
                                        ? "default"
                                        : registration.status === "PENDING"
                                        ? "secondary"
                                        : "outline"
                                    }
                                  >
                                    {registration.status.replaceAll("_", " ")}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 text-gray-700">
                                  {meta.bodyWeight ? `${meta.bodyWeight} kg` : "—"}
                                </td>
                                <td className="px-4 py-3">
                                  {canManageRegistrations ? (
                                    <div className="flex flex-wrap gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex items-center gap-1"
                                        disabled={registration.status === "APPROVED" || approveRegistration.isPending}
                                        onClick={() => handleApprove(registration.id)}
                                      >
                                        <CheckCircle2 className="h-4 w-4" />
                                        Approve
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex items-center gap-1 text-red-600"
                                        disabled={registration.status === "REJECTED" || rejectRegistration.isPending}
                                        onClick={() => handleReject(registration.id)}
                                      >
                                        <XCircle className="h-4 w-4" />
                                        Reject
                                      </Button>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-gray-500">View only</p>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "attempts" && (
              <Card>
                <CardHeader>
                  <CardTitle>Attempts</CardTitle>
                  <CardDescription>Lift history for this event</CardDescription>
                </CardHeader>
                <CardContent>
                  {attemptsLoading ? (
                    <div className="flex h-40 items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                    </div>
                  ) : attemptCount === 0 ? (
                    <div className="flex h-40 items-center justify-center text-sm text-gray-500">
                      No attempts recorded yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Athlete</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Lift</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Attempt #</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Weight</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Result</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {attempts?.map((attempt) => (
                            <tr key={attempt.id}>
                              <td className="px-4 py-3 text-gray-700">{attempt.user.name || attempt.user.email}</td>
                              <td className="px-4 py-3 text-gray-700">{attempt.lift}</td>
                              <td className="px-4 py-3 text-gray-700">{attempt.attemptNumber}</td>
                              <td className="px-4 py-3 text-gray-700">{attempt.weight} kg</td>
                              <td className="px-4 py-3">
                                <Badge
                                  variant={
                                    attempt.result === "GOOD"
                                      ? "default"
                                      : attempt.result === "NO_LIFT"
                                      ? "secondary"
                                      : "outline"
                                  }
                                >
                                  {attempt.result.replaceAll("_", " ")}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                {canManageAttempts ? (
                                  <div className="flex flex-wrap gap-2">
                                    <Button variant="outline" size="sm" className="flex items-center gap-1" asChild>
                                      <Link href={`/judge?eventId=${event.id}`}>
                                        <ClipboardList className="h-4 w-4" />
                                        Judge
                                      </Link>
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      className="flex items-center gap-1"
                                      onClick={() => handleDeleteAttempt(attempt.id)}
                                      disabled={deleteAttempt.isPending}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      Delete
                                    </Button>
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-500">View only</p>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "leaderboard" && (
              <Card>
                <CardHeader>
                  <CardTitle>Leaderboard</CardTitle>
                  <CardDescription>Live ranking by Sinclair coefficient</CardDescription>
                </CardHeader>
                <CardContent>
                  {leaderboardLoading ? (
                    <div className="flex h-40 items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                    </div>
                  ) : !leaderboard || leaderboard.length === 0 ? (
                    <div className="flex h-40 items-center justify-center text-sm text-gray-500">
                      No ranking data available yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Placement</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Athlete</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Category</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Total</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Sinclair/Points</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {leaderboard.map((entry: LeaderboardEntry, index) => (
                            <tr key={entry.userId ?? index}>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <Badge variant={index === 0 ? "default" : "secondary"}>
                                    <Trophy className="mr-1 h-3 w-3" />
                                    {index + 1}
                                  </Badge>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-gray-700">{entry.userName || "Unknown"}</td>
                              <td className="px-4 py-3 text-gray-700">{entry.categoryName || "—"}</td>
                              <td className="px-4 py-3 text-gray-700">{entry.total.toFixed(1)}</td>
                              <td className="px-4 py-3 text-gray-700">{entry.points ?? entry.sinclair ?? "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
