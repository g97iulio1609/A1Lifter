import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/attempts/route'
import { prisma } from '@/lib/db'

vi.mock('@/lib/db')
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(() => Promise.resolve({
    user: { id: 'user-1', role: 'JUDGE' }
  })),
}))

describe('/api/attempts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/attempts', () => {
    it('should create a new attempt', async () => {
      const newAttempt = {
        userId: 'athlete-1',
        eventId: 'event-1',
        categoryId: 'cat-1',
        registrationId: 'reg-1',
        lift: 'SNATCH',
        weight: 100,
        attemptNumber: 1,
      }

      const createdAttempt = {
        id: 'attempt-1',
        ...newAttempt,
        result: 'PENDING',
        notes: null,
        createdAt: new Date(),
        user: { id: 'athlete-1', name: 'John Doe' },
        event: { id: 'event-1', name: 'Test Event' },
        category: { id: 'cat-1', name: 'M73' },
      }

      vi.mocked(prisma.attempt.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.attempt.create).mockResolvedValue(createdAttempt as any)

      const request = new NextRequest('http://localhost:3000/api/attempts', {
        method: 'POST',
        body: JSON.stringify(newAttempt),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.weight).toBe(100)
      expect(prisma.attempt.create).toHaveBeenCalled()
    })

    it('should validate required fields', async () => {
      const invalidData = {
        userId: 'athlete-1',
        // Missing eventId, categoryId, lift, weight, attemptNumber
      }

      const request = new NextRequest('http://localhost:3000/api/attempts', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should prevent duplicate attempts', async () => {
      const newAttempt = {
        userId: 'athlete-1',
        eventId: 'event-1',
        categoryId: 'cat-1',
        registrationId: 'reg-1',
        lift: 'SNATCH',
        weight: 100,
        attemptNumber: 1,
      }

      const existingAttempt = {
        id: 'attempt-1',
        ...newAttempt,
        result: 'SUCCESSFUL',
        createdAt: new Date(),
      }

      vi.mocked(prisma.attempt.findUnique).mockResolvedValue(existingAttempt as any)

      const request = new NextRequest('http://localhost:3000/api/attempts', {
        method: 'POST',
        body: JSON.stringify(newAttempt),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('already exists')
    })
  })
})
