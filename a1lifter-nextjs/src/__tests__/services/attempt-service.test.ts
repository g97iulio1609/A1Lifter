import { describe, it, expect, beforeEach, vi } from "vitest"
import { AttemptService } from "@/lib/services/attempt-service"
import { prisma } from "@/lib/db"

// Mock Prisma
vi.mock("@/lib/db", () => ({
  prisma: {
    attempt: {
      count: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    event: {
      findUnique: vi.fn(),
    },
    registration: {
      findUnique: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
    record: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}))

describe("AttemptService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("getAttempts", () => {
    it("should return paginated attempts with default pagination", async () => {
      const mockAttempts = [
        {
          id: "1",
          userId: "user1",
          eventId: "event1",
          categoryId: "cat1",
          registrationId: "reg1",
          lift: "SNATCH",
          attemptNumber: 1,
          weight: 100,
          result: "PENDING",
          timestamp: new Date(),
          user: { id: "user1", name: "John Doe", email: "john@example.com" },
          event: { id: "event1", name: "Event 1", status: "IN_PROGRESS" },
          category: { id: "cat1", name: "Category 1", gender: "MALE", minWeight: 80, maxWeight: 100 },
        },
      ]

      vi.mocked(prisma.attempt.count).mockResolvedValue(1)
      vi.mocked(prisma.attempt.findMany).mockResolvedValue(mockAttempts as any)

      const result = await AttemptService.getAttempts({})

      expect(result).toEqual({
        attempts: mockAttempts,
        total: 1,
        limit: 50,
        offset: 0,
        hasMore: false,
      })
      expect(prisma.attempt.count).toHaveBeenCalledWith({ where: {} })
      expect(prisma.attempt.findMany).toHaveBeenCalledWith({
        where: {},
        include: expect.any(Object),
        orderBy: expect.any(Object),
        take: 50,
        skip: 0,
      })
    })

    it("should filter attempts by eventId", async () => {
      const eventId = "event1"
      vi.mocked(prisma.attempt.count).mockResolvedValue(0)
      vi.mocked(prisma.attempt.findMany).mockResolvedValue([])

      await AttemptService.getAttempts({ eventId })

      expect(prisma.attempt.count).toHaveBeenCalledWith({
        where: { eventId },
      })
    })

    it("should filter attempts by userId", async () => {
      const userId = "user1"
      vi.mocked(prisma.attempt.count).mockResolvedValue(0)
      vi.mocked(prisma.attempt.findMany).mockResolvedValue([])

      await AttemptService.getAttempts({ userId })

      expect(prisma.attempt.count).toHaveBeenCalledWith({
        where: { userId },
      })
    })

    it("should filter attempts by lift", async () => {
      const lift = "SNATCH" as const
      vi.mocked(prisma.attempt.count).mockResolvedValue(0)
      vi.mocked(prisma.attempt.findMany).mockResolvedValue([])

      await AttemptService.getAttempts({ lift })

      expect(prisma.attempt.count).toHaveBeenCalledWith({
        where: { lift },
      })
    })

    it("should apply custom pagination", async () => {
      vi.mocked(prisma.attempt.count).mockResolvedValue(100)
      vi.mocked(prisma.attempt.findMany).mockResolvedValue([])

      await AttemptService.getAttempts({ limit: 10, offset: 20 })

      expect(prisma.attempt.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        })
      )
    })

    it("should indicate hasMore when there are more records", async () => {
      vi.mocked(prisma.attempt.count).mockResolvedValue(100)
      vi.mocked(prisma.attempt.findMany).mockResolvedValue([])

      const result = await AttemptService.getAttempts({ limit: 10, offset: 0 })

      expect(result.hasMore).toBe(true)
    })
  })

  describe("createAttempt", () => {
    it("should create a new attempt", async () => {
      const attemptData = {
        userId: "user1",
        eventId: "event1",
        categoryId: "cat1",
        registrationId: "reg1",
        lift: "SNATCH" as const,
        attemptNumber: 1,
        weight: 100,
      }

      const mockAttempt = {
        id: "1",
        ...attemptData,
        result: "PENDING",
        timestamp: new Date(),
        user: { id: "user1", name: "John Doe" },
        event: { id: "event1", name: "Event 1" },
        category: { id: "cat1", name: "Category 1" },
      }

      vi.mocked(prisma.registration.findUnique).mockResolvedValue({
        id: "reg1",
        status: "APPROVED",
      } as any)
      vi.mocked(prisma.event.findUnique).mockResolvedValue({
        id: "event1",
        status: "IN_PROGRESS",
      } as any)
      vi.mocked(prisma.attempt.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.attempt.create).mockResolvedValue(mockAttempt as any)

      const result = await AttemptService.createAttempt(attemptData)

      expect(result).toEqual(mockAttempt)
      expect(prisma.registration.findUnique).toHaveBeenCalledWith({
        where: { id: attemptData.registrationId },
      })
      expect(prisma.attempt.findUnique).toHaveBeenCalledWith({
        where: {
          userId_eventId_lift_attemptNumber: {
            userId: attemptData.userId,
            eventId: attemptData.eventId,
            lift: attemptData.lift,
            attemptNumber: attemptData.attemptNumber,
          },
        },
      })
      expect(prisma.attempt.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...attemptData,
          result: "PENDING",
          timestamp: expect.any(Date),
        }),
        include: expect.any(Object),
      })
    })

    it("should throw error if attempt already exists", async () => {
      const attemptData = {
        userId: "user1",
        eventId: "event1",
        categoryId: "cat1",
        registrationId: "reg1",
        lift: "SNATCH" as const,
        attemptNumber: 1,
        weight: 100,
      }

      vi.mocked(prisma.attempt.findUnique).mockResolvedValue({
        id: "existing",
      } as any)

      await expect(AttemptService.createAttempt(attemptData)).rejects.toThrow(
        "Attempt with this number already exists for this user and lift"
      )
    })
  })

  describe("updateAttempt", () => {
    it("should update an attempt", async () => {
      const attemptId = "1"
      const updateData = {
        weight: 105,
        result: "GOOD" as const,
      }

      const existingAttempt = {
        id: attemptId,
        userId: "user1",
        eventId: "event1",
        lift: "SNATCH",
        attemptNumber: 1,
        weight: 100,
        result: "PENDING",
        user: { id: "user1", name: "John Doe" },
      }

      const updatedAttempt = {
        ...existingAttempt,
        weight: 105,
        result: "GOOD",
      }

      vi.mocked(prisma.attempt.findUnique).mockResolvedValue(existingAttempt as any)
      vi.mocked(prisma.attempt.update).mockResolvedValue(updatedAttempt as any)
      vi.mocked(prisma.notification.create).mockResolvedValue({} as any)
      vi.mocked(prisma.record.findFirst).mockResolvedValue(null)

      const result = await AttemptService.updateAttempt(attemptId, updateData)

      expect(result).toEqual(updatedAttempt)
      expect(prisma.attempt.update).toHaveBeenCalledWith({
        where: { id: attemptId },
        data: expect.objectContaining({
          weight: updateData.weight,
          result: updateData.result,
        }),
        include: expect.any(Object),
      })
    })

    it("should throw error if attempt not found", async () => {
      vi.mocked(prisma.attempt.findUnique).mockResolvedValue(null)

      await expect(
        AttemptService.updateAttempt("nonexistent", { weight: 100 })
      ).rejects.toThrow("Attempt not found")
    })

    it("should create notification when result is judged", async () => {
      const attemptId = "1"
      const updateData = {
        result: "GOOD" as const,
      }

      const existingAttempt = {
        id: attemptId,
        userId: "user1",
        eventId: "event1",
        lift: "SNATCH",
        attemptNumber: 1,
        weight: 100,
        result: "PENDING",
        user: { id: "user1", name: "John Doe" },
      }

      const updatedAttempt = {
        ...existingAttempt,
        result: "GOOD",
      }

      vi.mocked(prisma.attempt.findUnique).mockResolvedValue(existingAttempt as any)
      vi.mocked(prisma.attempt.update).mockResolvedValue(updatedAttempt as any)
      vi.mocked(prisma.notification.create).mockResolvedValue({} as any)
      vi.mocked(prisma.record.findFirst).mockResolvedValue(null)

      await AttemptService.updateAttempt(attemptId, updateData)

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: updatedAttempt.userId,
          type: "RESULT_POSTED",
          title: "Attempt Result",
        }),
      })
    })
  })

  describe("getCurrentAttempt", () => {
    it("should return the next pending attempt", async () => {
      const mockAttempt = {
        id: "1",
        userId: "user1",
        eventId: "event1",
        lift: "SNATCH",
        result: "PENDING",
        timestamp: new Date(),
      }

      vi.mocked(prisma.attempt.findFirst).mockResolvedValue(mockAttempt as any)

      const result = await AttemptService.getCurrentAttempt("event1")

      expect(result).toEqual(mockAttempt)
      expect(prisma.attempt.findFirst).toHaveBeenCalledWith({
        where: {
          eventId: "event1",
          result: "PENDING",
        },
        include: expect.any(Object),
        orderBy: [
          { timestamp: "asc" },
          { attemptNumber: "asc" },
        ],
      })
    })

    it("should return null if no pending attempts", async () => {
      vi.mocked(prisma.attempt.findFirst).mockResolvedValue(null)

      const result = await AttemptService.getCurrentAttempt("event1")

      expect(result).toBeNull()
    })
  })

  describe("getAthleteAttempts", () => {
    it("should return athlete attempts with summary", async () => {
      const mockAttempts = [
        {
          id: "1",
          lift: "SNATCH",
          weight: 100,
          result: "GOOD",
        },
        {
          id: "2",
          lift: "CLEAN_AND_JERK",
          weight: 120,
          result: "GOOD",
        },
      ]

      vi.mocked(prisma.attempt.findMany).mockResolvedValue(mockAttempts as any)

      const result = await AttemptService.getAthleteAttempts("user1", "event1")

      expect(result).toEqual({
        attempts: mockAttempts,
        summary: {
          bestSnatch: 100,
          bestCleanJerk: 120,
          total: 220,
          snatchAttempts: 1,
          cleanJerkAttempts: 1,
        },
      })
    })

    it("should calculate total from best lifts", async () => {
      const mockAttempts = [
        { id: "1", lift: "SNATCH", weight: 100, result: "GOOD" },
        { id: "2", lift: "SNATCH", weight: 105, result: "GOOD" },
        { id: "3", lift: "CLEAN_AND_JERK", weight: 120, result: "GOOD" },
        { id: "4", lift: "CLEAN_AND_JERK", weight: 125, result: "NO_LIFT" },
      ]

      vi.mocked(prisma.attempt.findMany).mockResolvedValue(mockAttempts as any)

      const result = await AttemptService.getAthleteAttempts("user1", "event1")

      expect(result.summary).toEqual({
        bestSnatch: 105,
        bestCleanJerk: 120,
        total: 225,
        snatchAttempts: 2,
        cleanJerkAttempts: 2,
      })
    })

    it("should handle zero successful lifts", async () => {
      const mockAttempts = [
        { id: "1", lift: "SNATCH", weight: 100, result: "NO_LIFT" },
        { id: "2", lift: "CLEAN_AND_JERK", weight: 120, result: "NO_LIFT" },
      ]

      vi.mocked(prisma.attempt.findMany).mockResolvedValue(mockAttempts as any)

      const result = await AttemptService.getAthleteAttempts("user1", "event1")

      expect(result.summary).toEqual({
        bestSnatch: 0,
        bestCleanJerk: 0,
        total: 0,
        snatchAttempts: 1,
        cleanJerkAttempts: 1,
      })
    })
  })
})
