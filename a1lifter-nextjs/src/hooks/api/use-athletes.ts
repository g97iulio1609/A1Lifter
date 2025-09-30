"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

const API_BASE = "/api"

export interface Athlete {
  id: string
  email: string
  name: string | null
  role: string
  isActive: boolean
  createdAt: Date
  _count?: {
    registrations: number
    attempts: number
  }
}

export interface AthleteFormData {
  email: string
  name: string
  password?: string
}

// Fetch all athletes
export function useAthletes() {
  return useQuery({
    queryKey: ["athletes"],
    queryFn: async (): Promise<Athlete[]> => {
      const response = await fetch(`${API_BASE}/athletes`)
      if (!response.ok) {
        throw new Error("Failed to fetch athletes")
      }
      const data = await response.json()
      return data.data
    },
  })
}

// Get single athlete
export function useAthlete(athleteId: string | undefined) {
  return useQuery({
    queryKey: ["athletes", athleteId],
    queryFn: async (): Promise<Athlete> => {
      if (!athleteId) throw new Error("Athlete ID is required")
      
      const response = await fetch(`${API_BASE}/athletes/${athleteId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch athlete")
      }
      const data = await response.json()
      return data.data
    },
    enabled: !!athleteId,
  })
}

// Create athlete
export function useCreateAthlete() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (athleteData: AthleteFormData): Promise<Athlete> => {
      const response = await fetch(`${API_BASE}/athletes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(athleteData),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create athlete")
      }
      
      const data = await response.json()
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["athletes"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
    },
  })
}

// Update athlete
export function useUpdateAthlete() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      athleteId, 
      athleteData 
    }: { 
      athleteId: string
      athleteData: Partial<AthleteFormData> 
    }): Promise<Athlete> => {
      const response = await fetch(`${API_BASE}/athletes/${athleteId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(athleteData),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update athlete")
      }
      
      const data = await response.json()
      return data.data
    },
    onSuccess: (_, { athleteId }) => {
      queryClient.invalidateQueries({ queryKey: ["athletes"] })
      queryClient.invalidateQueries({ queryKey: ["athletes", athleteId] })
    },
  })
}

// Delete athlete (soft delete)
export function useDeleteAthlete() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (athleteId: string): Promise<void> => {
      const response = await fetch(`${API_BASE}/athletes/${athleteId}`, {
        method: "DELETE",
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete athlete")
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["athletes"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
    },
  })
}

// Get athlete statistics
export function useAthleteStats(athleteId: string | undefined) {
  return useQuery({
    queryKey: ["athlete-stats", athleteId],
    queryFn: async () => {
      if (!athleteId) throw new Error("Athlete ID is required")
      
      const response = await fetch(`${API_BASE}/athletes/${athleteId}/stats`)
      if (!response.ok) {
        throw new Error("Failed to fetch athlete stats")
      }
      const data = await response.json()
      return data.data
    },
    enabled: !!athleteId,
  })
}
