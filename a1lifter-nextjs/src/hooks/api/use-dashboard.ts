"use client"

import { useQuery } from "@tanstack/react-query"

const API_BASE = "/api"

export interface DashboardStats {
  totalAthletes: number
  activeCompetitions: number
  todayResults: number
  recordsBroken: number
  totalEvents: number
  upcomingEvents: number
  completedEvents: number
  totalRegistrations: number
  pendingApprovals: number
}

// Fetch dashboard statistics
export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async (): Promise<DashboardStats> => {
      const response = await fetch(`${API_BASE}/dashboard/stats`)
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard stats")
      }
      const data = await response.json()
      return data.data
    },
    staleTime: 30000, // Cache for 30 seconds
  })
}

export interface CompetitionRecord {
  id: string
  eventId: string
  categoryId: string
  lift: string
  weight: number
  userId: string
  userName: string
  recordType: string
  previousRecord: number | null
  setAt: Date
  event?: {
    name: string
  }
  category?: {
    name: string
  }
}

// Fetch recent records
export function useRecentRecords(limit: number = 10) {
  return useQuery({
    queryKey: ["records", "recent", limit],
    queryFn: async (): Promise<CompetitionRecord[]> => {
      const response = await fetch(`${API_BASE}/records/recent?limit=${limit}`)
      if (!response.ok) {
        throw new Error("Failed to fetch recent records")
      }
      const data = await response.json()
      return data.data
    },
  })
}

// Fetch records for an event
export function useEventRecords(eventId: string | undefined) {
  return useQuery({
    queryKey: ["records", eventId],
    queryFn: async (): Promise<CompetitionRecord[]> => {
      if (!eventId) throw new Error("Event ID is required")
      
      const response = await fetch(`${API_BASE}/events/${eventId}/records`)
      if (!response.ok) {
        throw new Error("Failed to fetch event records")
      }
      const data = await response.json()
      return data.data
    },
    enabled: !!eventId,
  })
}
