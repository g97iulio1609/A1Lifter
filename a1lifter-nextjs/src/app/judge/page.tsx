"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useEvents } from "@/hooks/api/use-events"
import { useCurrentAttempt } from "@/hooks/api/use-attempts"
import { useJudgeAttempt } from "@/hooks/api/use-attempts"
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
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, Scale } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function JudgePage() {
  const { data: session } = useSession()
  const { data: events, isLoading: eventsLoading } = useEvents()
  const [selectedEventId, setSelectedEventId] = useState<string>("")
  const judgeAttempt = useJudgeAttempt()

  const { data: currentAttempt, isLoading: attemptLoading } = useCurrentAttempt(
    selectedEventId || undefined
  )

  // Enable real-time updates
  useRealtimeAttempts(selectedEventId || undefined)

  // Filter active events
  const activeEvents = events?.filter((e) => e.status === "IN_PROGRESS") || []

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please sign in to access judge interface.</p>
      </div>
    )
  }

  // Only judges and admins can access this page
  if (session.user.role !== "JUDGE" && session.user.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You don&apos;t have permission to access the judging interface.
          </p>
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

  const handleJudge = async (result: "GOOD" | "NO_LIFT" | "DISQUALIFIED") => {
    if (!currentAttempt) return

    try {
      await judgeAttempt.mutateAsync({
        attemptId: currentAttempt.id,
        judgeData: {
          result,
        },
      })

      toast.success(`Attempt judged as ${result}`, {
        description: `${currentAttempt.user.name} - ${currentAttempt.weight}kg ${currentAttempt.lift}`,
      })
    } catch (error) {
      toast.error("Failed to judge attempt", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    }
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
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold text-gray-900">Judge Interface</h1>
                  <Badge variant="default">
                    <Scale className="h-3 w-3 mr-1" />
                    {session.user.role}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">Make official lift judgments</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Event Selector */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Select Competition</CardTitle>
            </CardHeader>
            <CardContent>
              {eventsLoading ? (
                <div className="h-10 bg-gray-200 animate-pulse rounded" />
              ) : activeEvents.length > 0 ? (
                <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a competition to judge" />
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
                  <p className="text-gray-600">No active competitions</p>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedEventId && (
            <>
              {/* Current Attempt */}
              {attemptLoading ? (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading attempt...</p>
                    </div>
                  </CardContent>
                </Card>
              ) : currentAttempt ? (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-center text-2xl">Current Attempt</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Athlete Info */}
                      <div className="text-center">
                        <h2 className="text-4xl font-bold mb-2">
                          {currentAttempt.user.name}
                        </h2>
                        <Badge variant="outline" className="text-lg">
                          {currentAttempt.category.name}
                        </Badge>
                      </div>

                      {/* Lift Details */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
                        <div className="text-center">
                          <p className="text-sm text-gray-600 mb-2">Lift Type</p>
                          <p className="text-3xl font-bold text-blue-600 mb-4">
                            {currentAttempt.lift}
                          </p>
                          <p className="text-sm text-gray-600 mb-2">Weight</p>
                          <p className="text-6xl font-bold text-gray-900 mb-2">
                            {currentAttempt.weight}
                            <span className="text-3xl text-gray-600">kg</span>
                          </p>
                          <p className="text-lg text-gray-600">
                            Attempt #{currentAttempt.attemptNumber}
                          </p>
                        </div>
                      </div>

                      {/* Registration Details */}
                      {currentAttempt.registration && (
                        <div className="grid grid-cols-3 gap-4 text-center">
                          {currentAttempt.registration.lot && (
                            <div>
                              <p className="text-sm text-gray-600">Lot</p>
                              <p className="text-xl font-semibold">
                                {currentAttempt.registration.lot}
                              </p>
                            </div>
                          )}
                          {currentAttempt.registration.platform && (
                            <div>
                              <p className="text-sm text-gray-600">Platform</p>
                              <p className="text-xl font-semibold">
                                {currentAttempt.registration.platform}
                              </p>
                            </div>
                          )}
                          {currentAttempt.registration.bodyWeight && (
                            <div>
                              <p className="text-sm text-gray-600">Body Weight</p>
                              <p className="text-xl font-semibold">
                                {currentAttempt.registration.bodyWeight}kg
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Judge Buttons */}
                      <div className="grid grid-cols-3 gap-4 pt-4">
                        <Button
                          size="lg"
                          className="h-24 text-lg bg-green-600 hover:bg-green-700"
                          onClick={() => handleJudge("GOOD")}
                          disabled={judgeAttempt.isPending}
                        >
                          <CheckCircle className="h-8 w-8 mr-2" />
                          GOOD LIFT
                        </Button>
                        <Button
                          size="lg"
                          className="h-24 text-lg bg-red-600 hover:bg-red-700"
                          onClick={() => handleJudge("NO_LIFT")}
                          disabled={judgeAttempt.isPending}
                        >
                          <XCircle className="h-8 w-8 mr-2" />
                          NO LIFT
                        </Button>
                        <Button
                          size="lg"
                          variant="destructive"
                          className="h-24 text-lg"
                          onClick={() => handleJudge("DISQUALIFIED")}
                          disabled={judgeAttempt.isPending}
                        >
                          <AlertCircle className="h-8 w-8 mr-2" />
                          DISQUALIFY
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Scale className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Pending Attempts</h3>
                    <p className="text-gray-600">
                      Waiting for the next attempt to be loaded...
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
