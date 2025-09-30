"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { AttemptWithRelations } from "@/types"

const API_BASE = "/api"

export interface AttemptFormData {
  userId: string
  eventId: string
  categoryId: string
  registrationId: string
  lift: string
  attemptNumber: number
  weight: number
}

export interface JudgeAttemptData {
  result: "GOOD" | "NO_LIFT" | "DISQUALIFIED"
  judgeScores?: {
    judge1?: boolean
    judge2?: boolean
    judge3?: boolean
    headJudge?: boolean
  }
  notes?: string
}

// Fetch attempts for an event
export function useAttempts(eventId: string | undefined) {
  return useQuery({
    queryKey: ["attempts", eventId],
    queryFn: async (): Promise<AttemptWithRelations[]> => {
      if (!eventId) throw new Error("Event ID is required")
      
      const response = await fetch(`${API_BASE}/events/${eventId}/attempts`)
      if (!response.ok) {
        throw new Error("Failed to fetch attempts")
      }
      const data = await response.json()
      return data.data
    },
    enabled: !!eventId,
  })
}

// Fetch attempts for a specific athlete in an event
export function useAthleteAttempts(eventId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ["attempts", eventId, userId],
    queryFn: async (): Promise<AttemptWithRelations[]> => {
      if (!eventId || !userId) throw new Error("Event ID and User ID are required")
      
      const response = await fetch(`${API_BASE}/events/${eventId}/attempts?userId=${userId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch attempts")
      }
      const data = await response.json()
      return data.data
    },
    enabled: !!eventId && !!userId,
  })
}

// Get current attempt (for live judging)
export function useCurrentAttempt(eventId: string | undefined) {
  return useQuery({
    queryKey: ["current-attempt", eventId],
    queryFn: async () => {
      if (!eventId) throw new Error("Event ID is required")
      
      const response = await fetch(`${API_BASE}/events/${eventId}/attempts/current`)
      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error("Failed to fetch current attempt")
      }
      const data = await response.json()
      return data.data
    },
    enabled: !!eventId,
    refetchInterval: 5000, // Poll every 5 seconds for live updates
  })
}

// Create attempt
export function useCreateAttempt() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (attemptData: AttemptFormData): Promise<AttemptWithRelations> => {
      const response = await fetch(`${API_BASE}/attempts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(attemptData),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create attempt")
      }
      
      const data = await response.json()
      return data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["attempts", data.eventId] })
      queryClient.invalidateQueries({ queryKey: ["current-attempt", data.eventId] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
    },
  })
}

// Judge attempt (update result)
export function useJudgeAttempt() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      attemptId, 
      judgeData 
    }: { 
      attemptId: string
      judgeData: JudgeAttemptData
    }): Promise<AttemptWithRelations> => {
      const response = await fetch(`${API_BASE}/attempts/${attemptId}/judge`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(judgeData),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to judge attempt")
      }
      
      const data = await response.json()
      return data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["attempts", data.eventId] })
      queryClient.invalidateQueries({ queryKey: ["current-attempt", data.eventId] })
      queryClient.invalidateQueries({ queryKey: ["records"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
    },
  })
}

// Update attempt
export function useUpdateAttempt() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      attemptId, 
      attemptData 
    }: { 
      attemptId: string
      attemptData: Partial<AttemptFormData>
    }): Promise<AttemptWithRelations> => {
      const response = await fetch(`${API_BASE}/attempts/${attemptId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(attemptData),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update attempt")
      }
      
      const data = await response.json()
      return data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["attempts", data.eventId] })
    },
  })
}

// Delete attempt
export function useDeleteAttempt() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (attemptId: string): Promise<void> => {
      const response = await fetch(`${API_BASE}/attempts/${attemptId}`, {
        method: "DELETE",
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete attempt")
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attempts"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
    },
  })
}

// Get leaderboard for an event
export function useLeaderboard(eventId: string | undefined, categoryId?: string) {
  return useQuery({
    queryKey: ["leaderboard", eventId, categoryId],
    queryFn: async () => {
      if (!eventId) throw new Error("Event ID is required")
      
      const params = new URLSearchParams()
      if (categoryId) params.append("categoryId", categoryId)
      
      const response = await fetch(`${API_BASE}/events/${eventId}/leaderboard?${params}`)
      if (!response.ok) {
        throw new Error("Failed to fetch leaderboard")
      }
      const data = await response.json()
      return data.data
    },
    enabled: !!eventId,
  })
}
