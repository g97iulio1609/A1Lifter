/**
 * Database Operations Tests
 * Issue #6: Test DB operations with Supabase
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Database Operations - Users', () => {
  const testUserId = 'test-user-' + Date.now()
  
  afterAll(async () => {
    // Cleanup
    await prisma.user.deleteMany({
      where: { id: { startsWith: 'test-user-' } }
    })
    await prisma.$disconnect()
  })

  it('should create a new user', async () => {
    const user = await prisma.user.create({
      data: {
        id: testUserId,
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
        role: 'ATHLETE'
      }
    })

    expect(user).toBeDefined()
    expect(user.email).toContain('test-')
    expect(user.role).toBe('ATHLETE')
  })

  it('should read a user', async () => {
    const user = await prisma.user.findUnique({
      where: { id: testUserId }
    })

    expect(user).toBeDefined()
    expect(user?.id).toBe(testUserId)
  })

  it('should update a user', async () => {
    const updated = await prisma.user.update({
      where: { id: testUserId },
      data: { name: 'Updated Name' }
    })

    expect(updated.name).toBe('Updated Name')
  })

  it('should list users with filters', async () => {
    const athletes = await prisma.user.findMany({
      where: { role: 'ATHLETE' }
    })

    expect(Array.isArray(athletes)).toBe(true)
    expect(athletes.every(u => u.role === 'ATHLETE')).toBe(true)
  })
})

describe('Database Operations - Events', () => {
  let testOrganizerId: string
  let testEventId: string

  beforeAll(async () => {
    // Create test organizer
    const organizer = await prisma.user.create({
      data: {
        id: 'test-organizer-' + Date.now(),
        email: `organizer-${Date.now()}@example.com`,
        name: 'Test Organizer',
        role: 'ORGANIZER'
      }
    })
    testOrganizerId = organizer.id
  })

  afterAll(async () => {
    // Cleanup
    await prisma.event.deleteMany({
      where: { id: { startsWith: 'test-event-' } }
    })
    await prisma.user.deleteMany({
      where: { id: { startsWith: 'test-organizer-' } }
    })
  })

  it('should create an event', async () => {
    const event = await prisma.event.create({
      data: {
        id: 'test-event-' + Date.now(),
        name: 'Test Competition',
        sport: 'POWERLIFTING',
        status: 'PLANNED',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-06-02'),
        location: 'Test Gym',
        organizerId: testOrganizerId
      }
    })

    testEventId = event.id
    expect(event).toBeDefined()
    expect(event.name).toBe('Test Competition')
    expect(event.sport).toBe('POWERLIFTING')
  })

  it('should read event with organizer', async () => {
    const event = await prisma.event.findUnique({
      where: { id: testEventId },
      include: { organizer: true }
    })

    expect(event).toBeDefined()
    expect(event?.organizer).toBeDefined()
    expect(event?.organizer.role).toBe('ORGANIZER')
  })

  it('should update event status', async () => {
    const updated = await prisma.event.update({
      where: { id: testEventId },
      data: { status: 'REGISTRATION_OPEN' }
    })

    expect(updated.status).toBe('REGISTRATION_OPEN')
  })

  it('should soft delete event', async () => {
    const deleted = await prisma.event.update({
      where: { id: testEventId },
      data: { 
        isDeleted: true,
        deletedAt: new Date()
      }
    })

    expect(deleted.isDeleted).toBe(true)
    expect(deleted.deletedAt).toBeDefined()
  })

  it('should filter out deleted events', async () => {
    const events = await prisma.event.findMany({
      where: { isDeleted: false }
    })

    expect(events.every(e => !e.isDeleted)).toBe(true)
  })
})

describe('Database Operations - Registrations', () => {
  let testAthleteId: string
  let testEventId: string
  let testCategoryId: string
  let testRegistrationId: string

  beforeAll(async () => {
    // Setup test data
    const athlete = await prisma.user.create({
      data: {
        id: 'test-athlete-' + Date.now(),
        email: `athlete-${Date.now()}@example.com`,
        name: 'Test Athlete',
        role: 'ATHLETE'
      }
    })
    testAthleteId = athlete.id

    const organizer = await prisma.user.create({
      data: {
        id: 'test-org-' + Date.now(),
        email: `org-${Date.now()}@example.com`,
        name: 'Test Org',
        role: 'ORGANIZER'
      }
    })

    const event = await prisma.event.create({
      data: {
        id: 'test-evt-' + Date.now(),
        name: 'Test Event',
        sport: 'POWERLIFTING',
        status: 'REGISTRATION_OPEN',
        startDate: new Date(),
        endDate: new Date(),
        location: 'Test',
        organizerId: organizer.id
      }
    })
    testEventId = event.id

    const category = await prisma.category.create({
      data: {
        id: 'test-cat-' + Date.now(),
        name: 'Men -83kg',
        gender: 'MALE',
        maxWeight: 83,
        eventId: event.id
      }
    })
    testCategoryId = category.id
  })

  afterAll(async () => {
    // Cleanup
    await prisma.registration.deleteMany({
      where: { id: { startsWith: 'test-reg-' } }
    })
    await prisma.category.deleteMany({
      where: { id: { startsWith: 'test-cat-' } }
    })
    await prisma.event.deleteMany({
      where: { id: { startsWith: 'test-evt-' } }
    })
    await prisma.user.deleteMany({
      where: { 
        OR: [
          { id: { startsWith: 'test-athlete-' } },
          { id: { startsWith: 'test-org-' } }
        ]
      }
    })
  })

  it('should create a registration', async () => {
    const registration = await prisma.registration.create({
      data: {
        id: 'test-reg-' + Date.now(),
        userId: testAthleteId,
        eventId: testEventId,
        categoryId: testCategoryId,
        status: 'PENDING',
        bodyWeight: 82.5
      }
    })

    testRegistrationId = registration.id
    expect(registration).toBeDefined()
    expect(registration.status).toBe('PENDING')
    expect(registration.bodyWeight).toBe(82.5)
  })

  it('should read registration with relations', async () => {
    const registration = await prisma.registration.findUnique({
      where: { id: testRegistrationId },
      include: {
        user: true,
        event: true,
        category: true
      }
    })

    expect(registration).toBeDefined()
    expect(registration?.user.role).toBe('ATHLETE')
    expect(registration?.event.sport).toBe('POWERLIFTING')
    expect(registration?.category.name).toBe('Men -83kg')
  })

  it('should update registration status', async () => {
    const updated = await prisma.registration.update({
      where: { id: testRegistrationId },
      data: { status: 'APPROVED' }
    })

    expect(updated.status).toBe('APPROVED')
  })

  it('should enforce unique constraint', async () => {
    await expect(
      prisma.registration.create({
        data: {
          userId: testAthleteId,
          eventId: testEventId,
          categoryId: testCategoryId,
          status: 'PENDING'
        }
      })
    ).rejects.toThrow()
  })
})

describe('Database Operations - Attempts', () => {
  let testAthleteId: string
  let testEventId: string
  let testCategoryId: string
  let testRegistrationId: string

  beforeAll(async () => {
    // Create complete test setup
    const athlete = await prisma.user.create({
      data: {
        id: 'test-ath-' + Date.now(),
        email: `ath-${Date.now()}@example.com`,
        name: 'Test Athlete',
        role: 'ATHLETE'
      }
    })
    testAthleteId = athlete.id

    const organizer = await prisma.user.create({
      data: {
        id: 'test-org2-' + Date.now(),
        email: `org2-${Date.now()}@example.com`,
        name: 'Test Org',
        role: 'ORGANIZER'
      }
    })

    const event = await prisma.event.create({
      data: {
        id: 'test-evt2-' + Date.now(),
        name: 'Test Event',
        sport: 'POWERLIFTING',
        status: 'IN_PROGRESS',
        startDate: new Date(),
        endDate: new Date(),
        location: 'Test',
        organizerId: organizer.id
      }
    })
    testEventId = event.id

    const category = await prisma.category.create({
      data: {
        id: 'test-cat2-' + Date.now(),
        name: 'Men -83kg',
        gender: 'MALE',
        eventId: event.id
      }
    })
    testCategoryId = category.id

    const registration = await prisma.registration.create({
      data: {
        id: 'test-reg2-' + Date.now(),
        userId: athlete.id,
        eventId: event.id,
        categoryId: category.id,
        status: 'APPROVED'
      }
    })
    testRegistrationId = registration.id
  })

  afterAll(async () => {
    // Cleanup in correct order
    await prisma.attempt.deleteMany({
      where: { id: { startsWith: 'test-att-' } }
    })
    await prisma.registration.deleteMany({
      where: { id: { startsWith: 'test-reg2-' } }
    })
    await prisma.category.deleteMany({
      where: { id: { startsWith: 'test-cat2-' } }
    })
    await prisma.event.deleteMany({
      where: { id: { startsWith: 'test-evt2-' } }
    })
    await prisma.user.deleteMany({
      where: { 
        OR: [
          { id: { startsWith: 'test-ath-' } },
          { id: { startsWith: 'test-org2-' } }
        ]
      }
    })
  })

  it('should create an attempt', async () => {
    const attempt = await prisma.attempt.create({
      data: {
        id: 'test-att-' + Date.now(),
        userId: testAthleteId,
        eventId: testEventId,
        categoryId: testCategoryId,
        registrationId: testRegistrationId,
        lift: 'SQUAT',
        attemptNumber: 1,
        weight: 150,
        result: 'PENDING'
      }
    })

    expect(attempt).toBeDefined()
    expect(attempt.lift).toBe('SQUAT')
    expect(attempt.weight).toBe(150)
  })

  it('should update attempt result', async () => {
    const attempt = await prisma.attempt.findFirst({
      where: { 
        userId: testAthleteId,
        lift: 'SQUAT',
        attemptNumber: 1
      }
    })

    const updated = await prisma.attempt.update({
      where: { id: attempt!.id },
      data: { 
        result: 'GOOD',
        judgeScores: { judge1: true, judge2: true, judge3: true }
      }
    })

    expect(updated.result).toBe('GOOD')
    expect(updated.judgeScores).toBeDefined()
  })

  it('should query attempts with filters', async () => {
    const attempts = await prisma.attempt.findMany({
      where: {
        userId: testAthleteId,
        result: 'GOOD'
      },
      orderBy: { timestamp: 'desc' }
    })

    expect(Array.isArray(attempts)).toBe(true)
    expect(attempts.every(a => a.result === 'GOOD')).toBe(true)
  })
})

describe('Database Operations - Performance', () => {
  it('should handle bulk operations efficiently', async () => {
    const startTime = Date.now()

    // Create multiple users
    const users = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        prisma.user.create({
          data: {
            id: `perf-user-${Date.now()}-${i}`,
            email: `perf-${Date.now()}-${i}@example.com`,
            name: `Performance Test User ${i}`,
            role: 'ATHLETE'
          }
        })
      )
    )

    const duration = Date.now() - startTime

    expect(users.length).toBe(10)
    expect(duration).toBeLessThan(5000) // Should complete in 5 seconds

    // Cleanup
    await prisma.user.deleteMany({
      where: { id: { startsWith: 'perf-user-' } }
    })
  })

  it('should use indexes for queries', async () => {
    const startTime = Date.now()

    // Query that should use index
    const events = await prisma.event.findMany({
      where: {
        status: 'REGISTRATION_OPEN',
        isDeleted: false
      },
      orderBy: { startDate: 'desc' },
      take: 20
    })

    const duration = Date.now() - startTime

    expect(Array.isArray(events)).toBe(true)
    expect(duration).toBeLessThan(1000) // Should be fast with indexes
  })
})

describe('Database Operations - Transactions', () => {
  it('should handle transactions correctly', async () => {
    const testOrgId = 'txn-org-' + Date.now()
    const testEventId = 'txn-evt-' + Date.now()

    try {
      await prisma.$transaction(async (tx) => {
        // Create organizer
        await tx.user.create({
          data: {
            id: testOrgId,
            email: `txn-${Date.now()}@example.com`,
            name: 'Transaction Test',
            role: 'ORGANIZER'
          }
        })

        // Create event
        await tx.event.create({
          data: {
            id: testEventId,
            name: 'Transaction Test Event',
            sport: 'POWERLIFTING',
            status: 'PLANNED',
            startDate: new Date(),
            endDate: new Date(),
            location: 'Test',
            organizerId: testOrgId
          }
        })
      })

      // Verify both were created
      const org = await prisma.user.findUnique({ where: { id: testOrgId } })
      const event = await prisma.event.findUnique({ where: { id: testEventId } })

      expect(org).toBeDefined()
      expect(event).toBeDefined()
    } finally {
      // Cleanup
      await prisma.event.deleteMany({ where: { id: testEventId } })
      await prisma.user.deleteMany({ where: { id: testOrgId } })
    }
  })

  it('should rollback on error', async () => {
    const testId = 'rollback-' + Date.now()

    await expect(
      prisma.$transaction(async (tx) => {
        await tx.user.create({
          data: {
            id: testId,
            email: `rollback-${Date.now()}@example.com`,
            name: 'Rollback Test',
            role: 'ATHLETE'
          }
        })

        // This should cause rollback
        throw new Error('Intentional error')
      })
    ).rejects.toThrow()

    // Verify user was not created
    const user = await prisma.user.findUnique({ where: { id: testId } })
    expect(user).toBeNull()
  })
})
