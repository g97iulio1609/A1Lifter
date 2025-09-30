"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { RegistrationWithRelations } from "@/types"

const API_BASE = "/api"

export interface RegistrationFormData {
  userId: string
  eventId: string
  categoryId: string
  bodyWeight?: number
  notes?: string
}

export interface UpdateRegistrationData {
  status?: "PENDING" | "APPROVED" | "REJECTED" | "WAITLIST"
  bodyWeight?: number
  lot?: number
  platform?: string
  notes?: string
}

// Fetch registrations for an event
export function useRegistrations(eventId: string | undefined) {
  return useQuery({
    queryKey: ["registrations", eventId],
    queryFn: async (): Promise<RegistrationWithRelations[]> => {
      if (!eventId) throw new Error("Event ID is required")
      
      const response = await fetch(`${API_BASE}/events/${eventId}/registrations`)
      if (!response.ok) {
        throw new Error("Failed to fetch registrations")
      }
      const data = await response.json()
      return data.data
    },
    enabled: !!eventId,
  })
}

// Fetch user's registrations
export function useMyRegistrations() {
  return useQuery({
    queryKey: ["my-registrations"],
    queryFn: async (): Promise<RegistrationWithRelations[]> => {
      const response = await fetch(`${API_BASE}/registrations/me`)
      if (!response.ok) {
        throw new Error("Failed to fetch registrations")
      }
      const data = await response.json()
      return data.data
    },
  })
}

// Get single registration
export function useRegistration(registrationId: string | undefined) {
  return useQuery({
    queryKey: ["registrations", registrationId],
    queryFn: async (): Promise<RegistrationWithRelations> => {
      if (!registrationId) throw new Error("Registration ID is required")
      
      const response = await fetch(`${API_BASE}/registrations/${registrationId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch registration")
      }
      const data = await response.json()
      return data.data
    },
    enabled: !!registrationId,
  })
}

// Create registration
export function useCreateRegistration() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (registrationData: RegistrationFormData): Promise<RegistrationWithRelations> => {
      const response = await fetch(`${API_BASE}/registrations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationData),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create registration")
      }
      
      const data = await response.json()
      return data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["registrations", data.eventId] })
      queryClient.invalidateQueries({ queryKey: ["my-registrations"] })
      queryClient.invalidateQueries({ queryKey: ["events", data.eventId] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
    },
  })
}

// Update registration (for organizers/admins)
export function useUpdateRegistration() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      registrationId, 
      registrationData 
    }: { 
      registrationId: string
      registrationData: UpdateRegistrationData
    }): Promise<RegistrationWithRelations> => {
      const response = await fetch(`${API_BASE}/registrations/${registrationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationData),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update registration")
      }
      
      const data = await response.json()
      return data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["registrations", data.eventId] })
      queryClient.invalidateQueries({ queryKey: ["registrations", data.id] })
      queryClient.invalidateQueries({ queryKey: ["events", data.eventId] })
    },
  })
}

// Approve registration
export function useApproveRegistration() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (registrationId: string): Promise<RegistrationWithRelations> => {
      const response = await fetch(`${API_BASE}/registrations/${registrationId}/approve`, {
        method: "POST",
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to approve registration")
      }
      
      const data = await response.json()
      return data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["registrations", data.eventId] })
      queryClient.invalidateQueries({ queryKey: ["registrations", data.id] })
    },
  })
}

// Reject registration
export function useRejectRegistration() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (registrationId: string): Promise<RegistrationWithRelations> => {
      const response = await fetch(`${API_BASE}/registrations/${registrationId}/reject`, {
        method: "POST",
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to reject registration")
      }
      
      const data = await response.json()
      return data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["registrations", data.eventId] })
      queryClient.invalidateQueries({ queryKey: ["registrations", data.id] })
    },
  })
}

// Delete registration
export function useDeleteRegistration() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (registrationId: string): Promise<void> => {
      const response = await fetch(`${API_BASE}/registrations/${registrationId}`, {
        method: "DELETE",
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete registration")
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registrations"] })
      queryClient.invalidateQueries({ queryKey: ["my-registrations"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
    },
  })
}
