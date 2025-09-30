"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useEvents } from "@/hooks/api/use-events"
import {
  useRegistrations,
  useMyRegistrations,
  useApproveRegistration,
  useRejectRegistration,
} from "@/hooks/api/use-registrations"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Loader2,
  CalendarDays,
  Users,
  ArrowLeft,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

export default function RegistrationsPage() {
  const { data: session } = useSession()
  const { data: events } = useEvents()
  const [selectedEventId, setSelectedEventId] = useState<string>()
  const [search, setSearch] = useState("")

  const approveRegistration = useApproveRegistration()
  const rejectRegistration = useRejectRegistration()

  const isAthlete = session?.user?.role === "ATHLETE"

  useEffect(() => {
    if (isAthlete) return
    if (!events || events.length === 0) return
    if (selectedEventId) return

    setSelectedEventId(events[0].id)
  }, [isAthlete, events, selectedEventId])

  const {
    data: myRegistrations,
    isLoading: myRegistrationsLoading,
  } = useMyRegistrations()

  const {
    data: eventRegistrations,
    isLoading: registrationsLoading,
  } = useRegistrations(!isAthlete ? selectedEventId : undefined)

  const registrations = useMemo(() => {
    const source = isAthlete ? myRegistrations : eventRegistrations
    if (!source) return []

    const normalizedSearch = search.trim().toLowerCase()

    return source.filter((registration) => {
      const target = `${registration.user.name ?? ""} ${registration.user.email} ${registration.category.name}`.toLowerCase()
      return !normalizedSearch || target.includes(normalizedSearch)
    })
  }, [isAthlete, myRegistrations, eventRegistrations, search])

  const isLoading = isAthlete ? myRegistrationsLoading : registrationsLoading

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

  if (!session) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Please sign in to manage registrations</h1>
          <Link href="/auth/signin">
            <Button className="mt-4">Sign in</Button>
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
            <h1 className="text-3xl font-bold text-gray-900">Registrations</h1>
            <p className="mt-2 text-gray-600">
              {isAthlete ? "Track your competition registrations." : "Approve or reject athlete entries for each event."}
            </p>
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
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-12">
          {!isAthlete && (
            <Card className="md:col-span-4">
              <CardContent className="py-4">
                <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an event" />
                  </SelectTrigger>
                  <SelectContent>
                    {events?.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          <Card className={isAthlete ? "md:col-span-6" : "md:col-span-4"}>
            <CardContent className="py-4">
              <Input
                placeholder="Filter by athlete or category"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </CardContent>
          </Card>

          <Card className="md:col-span-4">
            <CardContent className="flex h-full items-center justify-center py-4 text-sm text-gray-600">
              Showing {registrations.length} registrations
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="flex h-[40vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : registrations.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center text-sm text-gray-500">
              <Users className="mb-4 h-10 w-10 text-gray-400" />
              {isAthlete
                ? "You are not registered for any competitions yet."
                : "No registrations found for the selected event."}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {registrations.map((registration) => (
              <Card key={registration.id} className="shadow-sm">
                <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {registration.user.name || registration.user.email}
                    </CardTitle>
                    <CardDescription>{registration.user.email}</CardDescription>
                  </div>
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
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-gray-600">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      <span>{registration.event.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{registration.category.name}</span>
                    </div>
                  </div>

                  {!isAthlete && (
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
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
