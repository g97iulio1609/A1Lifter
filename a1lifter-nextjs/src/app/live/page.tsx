"use client"

import { useState, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useEvents } from "@/hooks/api/use-events"
import { useAttempts } from "@/hooks/api/use-attempts"
import { useLeaderboard, LeaderboardEntry } from "@/hooks/api/use-attempts"
import { useRealtimeAttempts } from "@/hooks/api/use-realtime"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/components/i18n/I18nProvider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Trophy, TrendingUp, Activity, Zap, Play, Video } from "lucide-react"
import Link from "next/link"

export default function LivePage() {
  const { data: session } = useSession()
  const { data: events, isLoading: eventsLoading } = useEvents()
  const [selectedEventId, setSelectedEventId] = useState<string>("")
  const { t } = useI18n()

  const { data: attempts, isLoading: attemptsLoading } = useAttempts(
    selectedEventId || undefined
  )
  const { data: leaderboard, isLoading: leaderboardLoading } = useLeaderboard(
    selectedEventId || undefined
  )

  // Enable real-time updates for the selected event
  useRealtimeAttempts(selectedEventId || undefined)

  // Filter only active events
  const activeEvents = events?.filter((e) => e.status === "IN_PROGRESS" || e.liveStreamActive) || []
  const selectedEvent = useMemo(
    () => events?.find((event) => event.id === selectedEventId),
    [events, selectedEventId]
  )

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{t("live.title", "Live Results")}</p>
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
                  <h1 className="text-2xl font-bold text-gray-900">{t("live.title", "Live Results")}</h1>
                  <Badge variant="default" className="animate-pulse">
                    <Activity className="h-3 w-3 mr-1" />
                    LIVE
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{t("live.subtitle", "Real-time competition updates")}</p>
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
                    <SelectValue placeholder={t("live.select", "Choose a competition to view live results") ?? undefined} />
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
                  <p className="text-gray-600">{t("live.noActive", "No active competitions at the moment")}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedEventId && (
            <>
              {selectedEvent?.liveStreamUrl && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Video className="mr-2 h-5 w-5" />
                      {t("live.watchStream", "Livestream")}
                    </CardTitle>
                    <p className="text-sm text-gray-500">{selectedEvent.name}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedEvent.liveStreamEmbed ? (
                      <div className="aspect-video w-full overflow-hidden rounded-lg border border-gray-200 bg-black">
                        <iframe
                          src={selectedEvent.liveStreamEmbed}
                          className="h-full w-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title={`${selectedEvent.name} livestream`}
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-600">
                        <p>{t("live.streamProvided", "The organizer has provided a livestream link for this competition.")}</p>
                        <a
                          href={selectedEvent.liveStreamUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
                        >
                          <Play className="h-4 w-4" /> {t("live.openStream", "Open stream")}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Stream status:</span>
                      <span className={selectedEvent.liveStreamActive ? "text-green-600" : "text-gray-500"}>
                        {selectedEvent.liveStreamActive
                          ? t("live.streamStatus.featured", "Featured")
                          : t("live.streamStatus.offline", "Offline")}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

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
                            {attempt.videoUrl && (
                              <a
                                href={attempt.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500"
                              >
                                <Play className="h-3 w-3" /> Watch
                              </a>
                            )}
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
