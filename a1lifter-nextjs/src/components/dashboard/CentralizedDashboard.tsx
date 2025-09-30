"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useEvents } from "@/hooks/api/use-events"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Trophy, 
  Users, 
  Play, 
  Plus, 
  Calendar, 
  BarChart3, 
  Clock,
  Award,
  TrendingUp,
  Activity,
  Eye,
  Settings,
  ChevronRight,
  Zap
} from "lucide-react"

interface QuickAction {
  title: string
  description: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  href: string
  color: string
  disabled?: boolean
}

interface DashboardStats {
  totalAthletes: number
  activeCompetitions: number
  todayResults: number
  recordsBroken: number
}

export function CentralizedDashboard() {
  const { data: session } = useSession()
  const { data: events, isLoading: eventsLoading } = useEvents()
  const [stats, setStats] = useState<DashboardStats>({
    totalAthletes: 0,
    activeCompetitions: 0,
    todayResults: 0,
    recordsBroken: 0
  })

  useEffect(() => {
    if (!eventsLoading && events) {
      const activeComps = events.filter((e) => e.status === 'IN_PROGRESS').length
      setStats({
        totalAthletes: 247, // Mock data
        activeCompetitions: activeComps,
        todayResults: 23, // Mock data
        recordsBroken: 5 // Mock data
      })
    }
  }, [events, eventsLoading])

  const quickActions: QuickAction[] = [
    {
      title: "Create Competition",
      description: "Set up a new competition event",
      icon: Plus,
      href: "/events/create",
      color: "bg-blue-500"
    },
    {
      title: "Judge Interface",
      description: "Access judging dashboard",
      icon: Eye,
      href: "/judge",
      color: "bg-purple-500"
    },
    {
      title: "Live Results",
      description: "View real-time competition results",
      icon: Play,
      href: "/live",
      color: "bg-green-500"
    },
    {
      title: "Analytics",
      description: "View competition statistics",
      icon: BarChart3,
      href: "/analytics",
      color: "bg-orange-500"
    },
    {
      title: "Athletes",
      description: "Manage athlete registrations",
      icon: Users,
      href: "/athletes",
      color: "bg-indigo-500"
    },
    {
      title: "Settings",
      description: "Configure system settings",
      icon: Settings,
      href: "/settings",
      color: "bg-gray-500"
    }
  ]

  if (!session) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">A1Lifter</h1>
              <p className="text-sm text-gray-600">Competition Management Platform</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline">{session.user.role}</Badge>
              <Button variant="ghost" onClick={() => signOut()}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {session.user.name}!
            </h2>
            <p className="text-gray-600">
              Here's what's happening with your competitions today.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Athletes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalAthletes}</div>
                <p className="text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  +15% from last month
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Competitions</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeCompetitions}</div>
                <p className="text-xs text-muted-foreground">
                  <Activity className="h-3 w-3 inline mr-1" />
                  Currently running
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Results</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.todayResults}</div>
                <p className="text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 inline mr-1" />
                  Recorded today
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Records Broken</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.recordsBroken}</div>
                <p className="text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  This week
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {quickActions.map((action) => (
                <Card 
                  key={action.title}
                  className="hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => window.location.href = action.href}
                >
                  <CardContent className="p-4 text-center">
                    <div className={`${action.color} rounded-lg p-3 mb-3 mx-auto w-fit group-hover:scale-110 transition-transform`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="font-medium text-sm text-gray-900 mb-1">{action.title}</h4>
                    <p className="text-xs text-gray-600">{action.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Recent Events */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Recent Events</h3>
              <Button variant="outline" size="sm">
                View All
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
            
            {eventsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading events...</p>
              </div>
            ) : events && events.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {events.slice(0, 4).map((event) => (
                  <Card key={event.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{event.name}</CardTitle>
                          <CardDescription>{event.description}</CardDescription>
                        </div>
                        <Badge 
                          variant={event.status === 'IN_PROGRESS' ? 'default' : 'secondary'}
                        >
                          {event.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Sport:</span>
                          <p className="font-medium">{event.sport}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Location:</span>
                          <p className="font-medium">{event.location}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Start Date:</span>
                          <p className="font-medium">
                            {new Date(event.startDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">End Date:</span>
                          <p className="font-medium">
                            {new Date(event.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4 mr-2" />
                          Manage
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No events found</h4>
                  <p className="text-gray-600 text-center mb-4">
                    Get started by creating your first competition event.
                  </p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Event
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