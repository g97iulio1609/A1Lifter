"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useCreateEvent } from "@/hooks/api/use-events"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

export default function CreateEventPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const createEvent = useCreateEvent()

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!session?.user?.id) {
      toast.error("You must be logged in to create an event")
      return
    }

    try {
      await createEvent.mutateAsync({
        name: formData.name,
        description: formData.description || undefined,
        sport: formData.sport,
        status: formData.status,
        startDate: formData.startDate,
        endDate: formData.endDate,
        location: formData.location,
        maxAthletes: formData.maxAthletes ? parseInt(formData.maxAthletes) : undefined,
        organizerId: session.user.id,
      })

      toast.success("Event created successfully!")
      router.push("/dashboard")
    } catch (error) {
      toast.error("Failed to create event")
      console.error(error)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!session) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Event</h1>
              <p className="text-gray-600">Set up a new competition event</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
            <CardDescription>
              Fill in the information below to create your competition event
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Event Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="e.g. National Powerlifting Championship 2025"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleChange("location", e.target.value)}
                    placeholder="e.g. Rome, Italy"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Describe your event..."
                  className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="sport">Sport *</Label>
                  <Select value={formData.sport} onValueChange={(value) => handleChange("sport", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="POWERLIFTING">Powerlifting</SelectItem>
                      <SelectItem value="WEIGHTLIFTING">Weightlifting</SelectItem>
                      <SelectItem value="STRONGMAN">Strongman</SelectItem>
                      <SelectItem value="CROSSFIT">CrossFit</SelectItem>
                      <SelectItem value="STREETLIFTING">Streetlifting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PLANNED">Planned</SelectItem>
                      <SelectItem value="REGISTRATION_OPEN">Registration Open</SelectItem>
                      <SelectItem value="REGISTRATION_CLOSED">Registration Closed</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => handleChange("startDate", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => handleChange("endDate", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxAthletes">Maximum Athletes (Optional)</Label>
                <Input
                  id="maxAthletes"
                  type="number"
                  min="1"
                  value={formData.maxAthletes}
                  onChange={(e) => handleChange("maxAthletes", e.target.value)}
                  placeholder="e.g. 100"
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createEvent.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  {createEvent.isPending ? "Creating..." : "Create Event"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}