import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/athletes/route'
import { prisma } from '@/lib/db'

vi.mock('@/lib/db')
vi.mock('@/lib/auth', () => ({
  authOptions: {},
}))
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(() => Promise.resolve({
    user: { id: 'user-1', role: 'ADMIN' }
  })),
}))

describe('/api/athletes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/athletes', () => {
    it('should return all athletes when user is authenticated', async () => {
      const mockAthletes = [
        {
          id: 'athlete-1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'ATHLETE',
          isActive: true,
          createdAt: new Date(),
          lastLoginAt: new Date(),
          _count: { registrations: 0, attempts: 0 },
        },
      ]

      vi.mocked(prisma.user.findMany).mockResolvedValue(mockAthletes as any) // eslint-disable-line @typescript-eslint/no-explicit-any

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.data[0].name).toBe('John Doe')
      expect(prisma.user.findMany).toHaveBeenCalled()
    })

    it('should handle database errors gracefully', async () => {
      vi.mocked(prisma.user.findMany).mockRejectedValue(new Error('Database error'))

      const response = await GET()

      expect(response.status).toBe(500)
    })
  })

  describe('POST /api/athletes', () => {
    it('should create a new athlete', async () => {
      const newAthlete = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123',
      }

      const createdAthlete = {
        id: 'athlete-2',
        name: newAthlete.name,
        email: newAthlete.email,
        role: 'ATHLETE',
        isActive: true,
        createdAt: new Date(),
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.user.create).mockResolvedValue(createdAthlete as any)

      const request = new NextRequest('http://localhost:3000/api/athletes', {
        method: 'POST',
        body: JSON.stringify(newAthlete),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.name).toBe('Jane Doe')
      expect(prisma.user.create).toHaveBeenCalled()
    })

    it('should validate required fields', async () => {
      const invalidData = {
        name: 'Jane Doe',
        // Missing email
      }

      const request = new NextRequest('http://localhost:3000/api/athletes', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })
  })
})
