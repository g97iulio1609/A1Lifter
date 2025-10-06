"use client"

import { useEffect, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { RealtimeChannel } from "@supabase/supabase-js"

/**
 * Hook for subscribing to real-time events updates
 */
export function useRealtimeEvents() {
  const queryClient = useQueryClient()
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  useEffect(() => {
    const eventsChannel = supabase
      .channel("events-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "events",
        },
        (payload) => {
          console.log("Events realtime update:", payload)
          // Invalidate events query to refetch
          queryClient.invalidateQueries({ queryKey: ["events"] })
        }
      )
      .subscribe()

    setChannel(eventsChannel)

    return () => {
      eventsChannel.unsubscribe()
    }
  }, [queryClient])

  return { channel }
}

/**
 * Hook for subscribing to real-time attempts updates
 */
export function useRealtimeAttempts(eventId?: string) {
  const queryClient = useQueryClient()
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!eventId) return

    const attemptsChannel = supabase
      .channel(`attempts-${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attempts",
          filter: `eventId=eq.${eventId}`,
        },
        (payload) => {
          console.log("Attempts realtime update:", payload)
          // Invalidate relevant queries
          queryClient.invalidateQueries({ queryKey: ["attempts", eventId] })
          queryClient.invalidateQueries({ queryKey: ["events", eventId] })
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
        }
      )
      .subscribe()

    setChannel(attemptsChannel)

    return () => {
      attemptsChannel.unsubscribe()
    }
  }, [eventId, queryClient])

  return { channel }
}

/**
 * Hook for subscribing to real-time registrations updates
 */
export function useRealtimeRegistrations(eventId?: string) {
  const queryClient = useQueryClient()
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!eventId) return

    const registrationsChannel = supabase
      .channel(`registrations-${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "registrations",
          filter: `eventId=eq.${eventId}`,
        },
        (payload) => {
          console.log("Registrations realtime update:", payload)
          // Invalidate relevant queries
          queryClient.invalidateQueries({ queryKey: ["registrations", eventId] })
          queryClient.invalidateQueries({ queryKey: ["events", eventId] })
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
        }
      )
      .subscribe()

    setChannel(registrationsChannel)

    return () => {
      registrationsChannel.unsubscribe()
    }
  }, [eventId, queryClient])

  return { channel }
}

/**
 * Hook for subscribing to real-time records updates
 */
export function useRealtimeRecords(eventId?: string) {
  const queryClient = useQueryClient()
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!eventId) return

    const recordsChannel = supabase
      .channel(`records-${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "records",
          filter: `eventId=eq.${eventId}`,
        },
        (payload) => {
          console.log("New record set:", payload)
          // Invalidate relevant queries
          queryClient.invalidateQueries({ queryKey: ["records", eventId] })
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
        }
      )
      .subscribe()

    setChannel(recordsChannel)

    return () => {
      recordsChannel.unsubscribe()
    }
  }, [eventId, queryClient])

  return { channel }
}

/**
 * Hook for subscribing to all dashboard-relevant updates
 */
export function useRealtimeDashboard() {
  const queryClient = useQueryClient()
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  useEffect(() => {
    const dashboardChannel = supabase
      .channel("dashboard-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "events",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
          queryClient.invalidateQueries({ queryKey: ["events"] })
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "registrations",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attempts",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "records",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
        }
      )
      .subscribe()

    setChannel(dashboardChannel)

    return () => {
      dashboardChannel.unsubscribe()
    }
  }, [queryClient])

  return { channel }
}

/**
 * Hook for subscribing to notifications
 */
export function useRealtimeNotifications(userId: string) {
  const queryClient = useQueryClient()
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!userId) return

    const notificationsChannel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `userId=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["notifications", userId] })
          queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count", userId] })
          setUnreadCount((prev) => prev + 1)
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `userId=eq.${userId}`,
        },
        (payload: { old?: { isRead?: boolean }; new?: { isRead?: boolean } }) => {
          queryClient.invalidateQueries({ queryKey: ["notifications", userId] })
          queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count", userId] })

          const wasUnread = payload?.old?.isRead === false
          const nowUnread = payload?.new?.isRead === false

          if (wasUnread && !nowUnread) {
            setUnreadCount((prev) => Math.max(0, prev - 1))
          }

          if (!wasUnread && nowUnread) {
            setUnreadCount((prev) => prev + 1)
          }
        }
      )
      .subscribe()

    setChannel(notificationsChannel)

    return () => {
      notificationsChannel.unsubscribe()
    }
  }, [userId, queryClient])

  return { channel, unreadCount, setUnreadCount }
}
