"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { EventWithRelations, EventFormData } from "@/types"

const API_BASE = "/api"

// Fetch events
export function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: async (): Promise<EventWithRelations[]> => {
      const response = await fetch(`${API_BASE}/events`)
      if (!response.ok) {
        throw new Error("Failed to fetch events")
      }
      const data = await response.json()
      return data.data
    },
  })
}

// Create event
export function useCreateEvent() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (eventData: EventFormData): Promise<EventWithRelations> => {
      const response = await fetch(`${API_BASE}/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      })
      
      if (!response.ok) {
        throw new Error("Failed to create event")
      }
      
      const data = await response.json()
      return data.data
    },
    onSuccess: () => {
      // Invalidate and refetch events
      queryClient.invalidateQueries({ queryKey: ["events"] })
    },
  })
}

// Get single event
export function useEvent(eventId: string | undefined) {
  return useQuery({
    queryKey: ["events", eventId],
    queryFn: async (): Promise<EventWithRelations> => {
      if (!eventId) throw new Error("Event ID is required")
      
      const response = await fetch(`${API_BASE}/events/${eventId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch event")
      }
      const data = await response.json()
      return data.data
    },
    enabled: !!eventId,
  })
}

// Update event
export function useUpdateEvent() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      eventId, 
      eventData 
    }: { 
      eventId: string
      eventData: Partial<EventFormData> 
    }): Promise<EventWithRelations> => {
      const response = await fetch(`${API_BASE}/events/${eventId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      })
      
      if (!response.ok) {
        throw new Error("Failed to update event")
      }
      
      const data = await response.json()
      return data.data
    },
    onSuccess: (_, { eventId }) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["events"] })
      queryClient.invalidateQueries({ queryKey: ["events", eventId] })
    },
  })
}

// Delete event
export function useDeleteEvent() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (eventId: string): Promise<void> => {
      const response = await fetch(`${API_BASE}/events/${eventId}`, {
        method: "DELETE",
      })
      
      if (!response.ok) {
        throw new Error("Failed to delete event")
      }
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["events"] })
    },
  })
}