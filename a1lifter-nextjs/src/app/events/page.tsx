"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useEvents, useDeleteEvent } from "@/hooks/api/use-events"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RegisterToEventDialog } from "@/components/athletes/RegisterToEventDialog"
import {
  CalendarDays,
  MapPin,
  Users,
  Loader2,
  ArrowLeft,
  Pencil,
  Trash2,
  Eye,
  Plus,
} from "lucide-react"
import { toast } from "sonner"

const STATUS_OPTIONS = [
  "ALL",
  "PLANNED",
  "REGISTRATION_OPEN",
  "REGISTRATION_CLOSED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
  IN_PROGRESS: "default",
  REGISTRATION_OPEN: "default",
  REGISTRATION_CLOSED: "secondary",
  PLANNED: "secondary",
  COMPLETED: "outline",
  CANCELLED: "outline",
}

export default function EventsPage() {
  const { data: session } = useSession()
  const { data: events, isLoading } = useEvents()
  const deleteEvent = useDeleteEvent()
  const router = useRouter()

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")

  const isAdminOrOrganizer = session?.user.role === "ADMIN" || session?.user.role === "ORGANIZER"

  if (!session) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Please sign in to view events</h1>
          <p className="mt-2 text-gray-600">Sign in to browse and register for competitions.</p>
          <Button className="mt-4" asChild>
            <Link href="/auth/signin">Sign in</Link>
          </Button>
        </div>
      </div>
    )
  }

  const filteredEvents = (events ?? []).filter((event) => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    const matchesSearch =
      !normalizedSearch ||
      event.name.toLowerCase().includes(normalizedSearch) ||
      event.location.toLowerCase().includes(normalizedSearch)

    const matchesStatus = statusFilter === "ALL" || event.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleDelete = async (eventId: string, eventName: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${eventName}"?`)
    if (!confirmed) return

    try {
      await deleteEvent.mutateAsync(eventId)
      toast.success("Event deleted")
    } catch (error) {
      console.error(error)
      toast.error("Failed to delete event")
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Events</h1>
            <p className="mt-2 text-gray-600">
              {isAdminOrOrganizer
                ? "Create, schedule, and monitor your competitions."
                : "Browse and register for upcoming competitions."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            {isAdminOrOrganizer && (
              <Button asChild>
                <Link href="/events/create">
                  <Plus className="mr-2 h-4 w-4" />
                  New event
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-12">
          <Card className="md:col-span-6">
            <CardContent className="flex items-center gap-3 py-4">
              <Input
                placeholder="Search by event name or location"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </CardContent>
          </Card>
          <Card className="md:col-span-3">
            <CardContent className="py-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replaceAll("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
          <Card className="md:col-span-3">
            <CardContent className="flex h-full items-center justify-center py-4 text-sm text-gray-600">
              Showing {filteredEvents.length} of {events?.length ?? 0} events
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="flex h-[50vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarDays className="mb-4 h-10 w-10 text-gray-400" />
              <CardTitle className="text-xl">No events match your filters</CardTitle>
              <CardDescription>
                Adjust your search or create a new competition to get started.
              </CardDescription>
              <Button className="mt-4" asChild>
                <Link href="/events/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create event
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {filteredEvents.map((event) => {
              const registrationCount =
                (event as unknown as { _count?: { registrations: number } })._count?.registrations ??
                (Array.isArray(event.registrations) ? event.registrations.length : 0)

              // Check if user is already registered
              const userRegistrations = event.registrations || []
              const isRegistered = Array.isArray(userRegistrations) &&
                userRegistrations.some((reg: any) => reg.userId === session?.user?.id)

              return (
                <Card
                  key={event.id}
                  className="overflow-hidden shadow-sm transition-all hover:shadow-lg cursor-pointer"
                  onClick={() => router.push(`/events/${event.id}`)}
                >
                  <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <CardTitle className="text-xl">{event.name}</CardTitle>
                      <CardDescription>{event.description || "No description available"}</CardDescription>
                    </div>
                    <Badge variant={STATUS_VARIANTS[event.status] ?? "secondary"}>
                      {event.status.replaceAll("_", " ")}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                      <div className="flex items-center gap-2 text-gray-600">
                        <CalendarDays className="h-4 w-4" />
                        <div>
                          <p>{new Date(event.startDate).toLocaleDateString()}</p>
                          <p className="text-xs">Start</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <CalendarDays className="h-4 w-4" />
                        <div>
                          <p>{new Date(event.endDate).toLocaleDateString()}</p>
                          <p className="text-xs">End</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>{registrationCount} athletes</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge variant="secondary">{event.sport}</Badge>
                      {event.categories.slice(0, 3).map((category) => (
                        <Badge key={category.id} variant="outline">
                          {category.name}
                        </Badge>
                      ))}
                      {event.categories.length > 3 && (
                        <Badge variant="outline">+{event.categories.length - 3} more</Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3" onClick={(e) => e.stopPropagation()}>
                      {isAdminOrOrganizer ? (
                        <>
                          <Button variant="outline" size="sm" className="flex items-center gap-2" asChild>
                            <Link href={`/events/${event.id}/edit`}>
                              <Pencil className="h-4 w-4" />
                              Edit
                            </Link>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="flex items-center gap-2"
                            disabled={deleteEvent.isPending}
                            onClick={() => handleDelete(event.id, event.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </>
                      ) : (
                        <>
                          {isRegistered ? (
                            <Badge variant="default" className="px-3 py-1">
                              ✓ Registered
                            </Badge>
                          ) : event.status === "REGISTRATION_OPEN" ? (
                            <RegisterToEventDialog
                              event={{
                                id: event.id,
                                name: event.name,
                                categories: event.categories,
                              }}
                              onSuccess={() => window.location.reload()}
                            />
                          ) : (
                            <Badge variant="outline" className="px-3 py-1">
                              Registration {event.status === "PLANNED" ? "not open" : "closed"}
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
