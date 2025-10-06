"use client"

import { useQuery } from "@tanstack/react-query"

const API_BASE = "/api"

export interface TopLifter {
  userId: string
  userName: string
  eventId: string
  eventName: string
  categoryName: string
  gender: string
  bodyWeight: number | null
  bestSnatch: number
  bestCleanAndJerk: number
  total: number
  points: number | null
  sinclair: number | null
}

export function useTopLifters(limit: number = 5) {
  return useQuery({
    queryKey: ["analytics", "top-lifters", limit],
    queryFn: async (): Promise<TopLifter[]> => {
      const response = await fetch(`${API_BASE}/analytics/top-lifters?limit=${limit}`)
      if (!response.ok) {
        throw new Error("Failed to fetch top lifters")
      }
      const data = await response.json()
      return data.data
    },
  })
}

export interface AnalyticsTrendData {
  attemptsPerDay: Array<{ date: string; total: number; good: number; noLift: number; disqualified: number }>
  liftAverages: Array<{ lift: string; average: number }>
  resultDistribution: Array<{ result: string; count: number }>
  participationByGender: Array<{ gender: string; athletes: number }>
}

export function useAnalyticsTrends(days: number = 14) {
  return useQuery({
    queryKey: ["analytics", "trends", days],
    queryFn: async (): Promise<AnalyticsTrendData> => {
      const response = await fetch(`${API_BASE}/analytics/trends?days=${days}`)
      if (!response.ok) {
        throw new Error("Failed to fetch analytics trends")
      }
      const data = await response.json()
      return data.data
    },
  })
}
