"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useAthletes } from "@/hooks/api/use-athletes"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Users, Search, Plus, Mail, Trophy, TrendingUp, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AthletesPage() {
  const { data: session } = useSession()
  const { data: athletes, isLoading } = useAthletes()
  const [searchTerm, setSearchTerm] = useState("")

  // Filter athletes based on search
  const filteredAthletes = athletes?.filter((athlete) =>
    athlete.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    athlete.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please sign in to view athletes.</p>
      </div>
    )
  }

  // Only admins and organizers can view this page
  if (session.user.role !== "ADMIN" && session.user.role !== "ORGANIZER") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don&apos;t have permission to view this page.</p>
          <Link href="/dashboard">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Athletes Management</h1>
                <p className="text-sm text-gray-600">Manage athlete profiles and registrations</p>
              </div>
            </div>
            <Link href="/athletes/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Athlete
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Athletes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{athletes?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Registered in platform</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Athletes</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {athletes?.filter((a) => a.isActive).length || 0}
                </div>
                <p className="text-xs text-muted-foreground">Currently active</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">With Competitions</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {athletes?.filter((a) => a._count && a._count.registrations > 0).length || 0}
                </div>
                <p className="text-xs text-muted-foreground">Have registrations</p>
              </CardContent>
            </Card>
          </div>

          {/* Search Bar */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search athletes by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Athletes List */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading athletes...</p>
            </div>
          ) : filteredAthletes && filteredAthletes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAthletes.map((athlete) => (
                <Card key={athlete.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{athlete.name || "Unnamed"}</CardTitle>
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <Mail className="h-3 w-3 mr-1" />
                          {athlete.email}
                        </div>
                      </div>
                      <Badge variant={athlete.isActive ? "default" : "secondary"}>
                        {athlete.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Role:</span>
                        <span className="font-medium">{athlete.role}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Registrations:</span>
                        <span className="font-medium">
                          {athlete._count?.registrations || 0}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Attempts:</span>
                        <span className="font-medium">
                          {athlete._count?.attempts || 0}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Member since:</span>
                        <span className="font-medium">
                          {new Date(athlete.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 flex space-x-2">
                      <Link href={`/athletes/${athlete.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          View Profile
                        </Button>
                      </Link>
                      <Link href={`/athletes/${athlete.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          Stats
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-gray-400 mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No athletes found</h4>
                <p className="text-gray-600 text-center">
                  {searchTerm
                    ? "Try adjusting your search terms"
                    : "No athletes have been registered yet"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
