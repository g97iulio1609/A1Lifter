"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEvents } from "@/hooks/api/use-events"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Users, Trophy, Plus } from "lucide-react"
import { useMemo } from "react"

export default function DashboardPage() {
  const { data: session } = useSession()
  const { data: events, isLoading, error } = useEvents()
  const router = useRouter()

  const stats = useMemo(() => {
    if (!events) return {
      totalEvents: 0,
      activeCompetitions: 0,
      totalAthletes: 0,
      totalRegistrations: 0
    }

    return {
      totalEvents: events.length,
      activeCompetitions: events.filter(e => e.status === 'IN_PROGRESS').length,
      totalAthletes: 0, // Will be calculated from registrations
      totalRegistrations: 0 // Will be calculated from registrations
    }
  }, [events])

  if (!session) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">A1Lifter Dashboard</h1>
              <p className="text-gray-600">Welcome back, {session.user.name}!</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Role: {session.user.role}</span>
              <Button variant="outline" onClick={() => signOut()}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalEvents}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Competitions</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeCompetitions}</div>
                <p className="text-xs text-muted-foreground">Currently running</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Athletes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalAthletes}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Registrations</CardTitle>
                <Plus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalRegistrations}</div>
              </CardContent>
            </Card>
          </div>

          {/* Events Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Recent Events</h2>
              <Button onClick={() => router.push('/events/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </div>
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading events...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600">Error loading events: {error.message}</p>
              </div>
            ) : events && events.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <Card key={event.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">{event.name}</CardTitle>
                      <CardDescription>{event.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Sport:</span>
                          <span className="font-medium">{event.sport}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Status:</span>
                          <span className="font-medium">{event.status}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Location:</span>
                          <span className="font-medium">{event.location}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Date:</span>
                          <span className="font-medium">
                            {new Date(event.startDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 flex space-x-2">
                        <Button variant="outline" size="sm">View</Button>
                        <Button variant="outline" size="sm">Edit</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
                  <p className="text-gray-600 text-center mb-4">
                    Get started by creating your first competition event.
                  </p>
                  <Button onClick={() => router.push('/events/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Event
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}