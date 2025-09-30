"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useEvent, useUpdateEvent } from "@/hooks/api/use-events"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, ArrowLeft, Save } from "lucide-react"

interface EventEditPageProps {
  params: {
    eventId: string
  }
}

const STATUS_OPTIONS = [
  "PLANNED",
  "REGISTRATION_OPEN",
  "REGISTRATION_CLOSED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]

const SPORT_OPTIONS = [
  "POWERLIFTING",
  "WEIGHTLIFTING",
  "STRONGMAN",
  "CROSSFIT",
  "STREETLIFTING",
]

export default function EditEventPage({ params }: EventEditPageProps) {
  const { eventId } = params
  const router = useRouter()
  const { data: session } = useSession()
  const { data: event, isLoading } = useEvent(eventId)
  const updateEvent = useUpdateEvent()

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sport: "POWERLIFTING",
    status: "PLANNED",
    startDate: "",
    endDate: "",
    location: "",
    maxAthletes: "",
  })

  useEffect(() => {
    if (!event) return

    setFormData({
      name: event.name,
      description: event.description ?? "",
      sport: event.sport,
      status: event.status,
      startDate: new Date(event.startDate).toISOString().slice(0, 16),
      endDate: new Date(event.endDate).toISOString().slice(0, 16),
      location: event.location,
      maxAthletes: event.maxAthletes ? String(event.maxAthletes) : "",
    })
  }, [event])

  if (!session) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Please sign in to edit events</h1>
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
          <p className="mt-2 text-gray-600">Only organizers and admins can edit events.</p>
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

  if (isLoading || !event) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (eventForm: React.FormEvent) => {
    eventForm.preventDefault()

    try {
      await updateEvent.mutateAsync({
        eventId,
        eventData: {
          name: formData.name,
          description: formData.description,
          sport: formData.sport,
          status: formData.status,
          startDate: formData.startDate,
          endDate: formData.endDate,
          location: formData.location,
          maxAthletes: formData.maxAthletes ? Number(formData.maxAthletes) : undefined,
        },
      })

      toast.success("Event updated successfully")
      router.push(`/events/${eventId}`)
    } catch (error) {
      console.error(error)
      toast.error("Unable to update event")
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-8 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit event</h1>
            <p className="mt-2 text-gray-600">Update scheduling and logistics details.</p>
          </div>
          <div className="flex gap-3">
            <Link href={`/events/${eventId}`}>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </Link>
            <Button form="edit-event-form" type="submit" disabled={updateEvent.isPending}>
              {updateEvent.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save changes
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Event details</CardTitle>
            <CardDescription>Only organizers and admins can modify these fields.</CardDescription>
          </CardHeader>
          <CardContent>
            <form id="edit-event-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(event) => handleChange("name", event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(event) => handleChange("location", event.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  rows={4}
                  value={formData.description}
                  onChange={(event) => handleChange("description", event.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sport">Sport *</Label>
                  <Select value={formData.sport} onValueChange={(value) => handleChange("sport", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sport" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPORT_OPTIONS.map((sport) => (
                        <SelectItem key={sport} value={sport}>
                          {sport.replaceAll("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.replaceAll("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start date *</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(event) => handleChange("startDate", event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End date *</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(event) => handleChange("endDate", event.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxAthletes">Max athletes</Label>
                <Input
                  id="maxAthletes"
                  type="number"
                  min={1}
                  value={formData.maxAthletes}
                  onChange={(event) => handleChange("maxAthletes", event.target.value)}
                />
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
