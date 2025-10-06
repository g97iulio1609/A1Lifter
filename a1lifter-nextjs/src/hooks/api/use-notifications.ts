"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

const API_BASE = "/api"

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  data: Record<string, unknown> | null
  isRead: boolean
  readAt: string | null
  createdAt: string
}

export function useNotifications(userId: string | undefined) {
  return useQuery({
    queryKey: ["notifications", userId],
    queryFn: async (): Promise<Notification[]> => {
      const response = await fetch(`${API_BASE}/notifications`)
      if (!response.ok) {
        throw new Error("Failed to fetch notifications")
      }
      const data = await response.json()
      return data.data
    },
    enabled: !!userId,
  })
}

export function useUnreadNotificationsCount(userId: string | undefined) {
  return useQuery({
    queryKey: ["notifications", "unread-count", userId],
    queryFn: async (): Promise<number> => {
      const response = await fetch(`${API_BASE}/notifications/unread-count`)
      if (!response.ok) {
        throw new Error("Failed to fetch unread count")
      }
      const data = await response.json()
      return data.data
    },
    enabled: !!userId,
  })
}

export function useMarkNotificationRead(userId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      notificationId,
      isRead = true,
    }: {
      notificationId: string
      isRead?: boolean
    }): Promise<Notification> => {
      const response = await fetch(`${API_BASE}/notifications/${notificationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isRead }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || "Failed to update notification")
      }

      const data = await response.json()
      return data.data
    },
    onSuccess: () => {
      if (!userId) return
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] })
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count", userId] })
    },
  })
}

export function useMarkAllNotificationsRead(userId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_BASE}/notifications/mark-all`, {
        method: "PATCH",
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || "Failed to mark notifications")
      }

      const data = await response.json()
      return data.data as { updated: number }
    },
    onSuccess: () => {
      if (!userId) return
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] })
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count", userId] })
    },
  })
}
