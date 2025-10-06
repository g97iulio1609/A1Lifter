import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAthletes } from '@/hooks/api/use-athletes'
import React from 'react'

// Mock fetch
global.fetch = vi.fn()

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useAthletes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch athletes successfully', async () => {
    const mockAthletes = [
      {
        id: 'athlete-1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'ATHLETE',
      },
    ]

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockAthletes }),
    })

    const { result } = renderHook(() => useAthletes(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockAthletes)
    expect(global.fetch).toHaveBeenCalledWith('/api/athletes')
  })

  it('should handle fetch errors', async () => {
    ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useAthletes(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBeTruthy()
  })
})
