"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useEvents } from "@/hooks/api/use-events"
import { useAttempts } from "@/hooks/api/use-attempts"
import { useLeaderboard, LeaderboardEntry } from "@/hooks/api/use-attempts"
import { useRealtimeAttempts } from "@/hooks/api/use-realtime"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Trophy, TrendingUp, Activity, Zap } from "lucide-react"
import Link from "next/link"

export default function LivePage() {
  const { data: session } = useSession()
  const { data: events, isLoading: eventsLoading } = useEvents()
  const [selectedEventId, setSelectedEventId] = useState<string>("")

  const { data: attempts, isLoading: attemptsLoading } = useAttempts(
    selectedEventId || undefined
  )
  const { data: leaderboard, isLoading: leaderboardLoading } = useLeaderboard(
    selectedEventId || undefined
  )

  // Enable real-time updates for the selected event
  useRealtimeAttempts(selectedEventId || undefined)

  // Filter only active events
  const activeEvents = events?.filter((e) => e.status === "IN_PROGRESS") || []

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please sign in to view live results.</p>
      </div>
    )
  }

  // Get recent attempts (last 10)
  const recentAttempts = attempts?.slice(0, 10) || []

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
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold text-gray-900">Live Results</h1>
                  <Badge variant="default" className="animate-pulse">
                    <Activity className="h-3 w-3 mr-1" />
                    LIVE
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">Real-time competition updates</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Event Selector */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Select Active Competition</CardTitle>
            </CardHeader>
            <CardContent>
              {eventsLoading ? (
                <div className="h-10 bg-gray-200 animate-pulse rounded" />
              ) : activeEvents.length > 0 ? (
                <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a competition to view live results" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeEvents.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.name} - {event.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-600">No active competitions at the moment</p>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedEventId && (
            <>
              {/* Leaderboard */}
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center">
                      <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                      Leaderboard
                    </CardTitle>
                    <Badge variant="outline">
                      <Zap className="h-3 w-3 mr-1" />
                      Auto-updating
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {leaderboardLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-gray-200 animate-pulse rounded" />
                      ))}
                    </div>
                  ) : leaderboard && leaderboard.length > 0 ? (
                    <div className="space-y-3">
                      {leaderboard.map((athlete: LeaderboardEntry, index: number) => (
                        <div
                          key={`${athlete.userId}-${athlete.categoryId}`}
                          className={`flex items-center justify-between p-4 rounded-lg border ${
                            index === 0
                              ? "bg-yellow-50 border-yellow-300"
                              : index === 1
                              ? "bg-gray-50 border-gray-300"
                              : index === 2
                              ? "bg-orange-50 border-orange-300"
                              : "bg-white border-gray-200"
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="text-2xl font-bold text-gray-400 w-8 text-center">
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="font-semibold">{athlete.userName}</h4>
                              <p className="text-sm text-gray-600">
                                {athlete.categoryName} • {athlete.bodyWeight}kg
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">{athlete.total.toFixed(1)}kg</div>
                            <div className="text-xs text-gray-600">
                              {Object.entries(athlete.lifts).map(([lift, weight]) => (
                                <span key={lift} className="mr-2">
                                  {lift}: {String(weight)}kg
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-600">
                      No results available yet
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Attempts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Recent Attempts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {attemptsLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-12 bg-gray-200 animate-pulse rounded" />
                      ))}
                    </div>
                  ) : recentAttempts.length > 0 ? (
                    <div className="space-y-2">
                      {recentAttempts.map((attempt) => (
                        <div
                          key={attempt.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <Badge
                                variant={
                                  attempt.result === "GOOD"
                                    ? "default"
                                    : attempt.result === "NO_LIFT"
                                    ? "destructive"
                                    : "secondary"
                                }
                              >
                                {attempt.result}
                              </Badge>
                            </div>
                            <div>
                              <p className="font-medium">{attempt.user.name}</p>
                              <p className="text-sm text-gray-600">
                                {attempt.lift} - Attempt #{attempt.attemptNumber}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">{attempt.weight}kg</p>
                            <p className="text-xs text-gray-500">
                              {new Date(attempt.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-600">
                      No attempts recorded yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
