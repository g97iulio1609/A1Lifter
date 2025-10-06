/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from "vitest"
import { AttemptService } from "@/lib/services/attempt-service"
import { prisma } from "@/lib/db"

vi.mock("@/lib/db", () => ({
  prisma: {
    attempt: {
      count: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
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
  },
}))

describe("AttemptService", () => {
  const baseAttempt = {
    id: "attempt-1",
    userId: "user-1",
    eventId: "event-1",
    categoryId: "category-1",
    registrationId: "registration-1",
    lift: "SNATCH",
    attemptNumber: 1,
    weight: 100,
    result: "PENDING",
    status: "QUEUED",
    timestamp: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.attempt.updateMany).mockResolvedValue({ count: 0 } as any)
    vi.mocked(prisma.notification.create).mockResolvedValue({} as any)
  })

  describe("getAttempts", () => {
    it("applies filters and returns pagination metadata", async () => {
      const attempts = [{ ...baseAttempt }]
      vi.mocked(prisma.attempt.count).mockResolvedValue(1)
      vi.mocked(prisma.attempt.findMany).mockResolvedValue(attempts as any)

      const result = await AttemptService.getAttempts({
        eventId: baseAttempt.eventId,
        status: "QUEUED",
        limit: 10,
        offset: 0,
      })

      expect(result).toEqual({
        attempts,
        total: 1,
        limit: 10,
        offset: 0,
        hasMore: false,
      })
      expect(prisma.attempt.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            eventId: baseAttempt.eventId,
            status: "QUEUED",
          }),
          take: 10,
          skip: 0,
        })
      )
    })
  })

  describe("createAttempt", () => {
    it("creates a pending attempt queued for judging", async () => {
      vi.mocked(prisma.attempt.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.registration.findUnique).mockResolvedValue({
        id: baseAttempt.registrationId,
        status: "APPROVED",
      } as any)
      vi.mocked(prisma.event.findUnique).mockResolvedValue({
        id: baseAttempt.eventId,
        status: "IN_PROGRESS",
      } as any)
      vi.mocked(prisma.attempt.create).mockResolvedValue({
        ...baseAttempt,
        result: "PENDING",
        status: "QUEUED",
      } as any)

      const result = await AttemptService.createAttempt({
        userId: baseAttempt.userId,
        eventId: baseAttempt.eventId,
        categoryId: baseAttempt.categoryId,
        registrationId: baseAttempt.registrationId,
        lift: baseAttempt.lift as "SNATCH",
        attemptNumber: baseAttempt.attemptNumber,
        weight: baseAttempt.weight,
      })

      expect(result.status).toBe("QUEUED")
      expect(prisma.attempt.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: "QUEUED",
          result: "PENDING",
        }),
        include: expect.any(Object),
      })
    })
  })

  describe("updateAttempt", () => {
    it("marks attempt as completed when judge submits result", async () => {
      vi.mocked(prisma.attempt.findUnique).mockResolvedValue({
        ...baseAttempt,
        status: "IN_PROGRESS",
        lockedBy: "judge-1",
      } as any)
      vi.mocked(prisma.attempt.update).mockResolvedValue({
        ...baseAttempt,
        status: "COMPLETED",
        result: "GOOD",
        lockedBy: null,
        lockedAt: null,
        judgedBy: "judge-1",
      } as any)

      const result = await AttemptService.updateAttempt(
        baseAttempt.id,
        { result: "GOOD" },
        "judge-1"
      )

      expect(result.status).toBe("COMPLETED")
      expect(prisma.attempt.update).toHaveBeenCalledWith({
        where: { id: baseAttempt.id },
        data: expect.objectContaining({
          status: "COMPLETED",
          judgedBy: "judge-1",
          lockedBy: null,
        }),
        include: expect.any(Object),
      })
      expect(prisma.notification.create).toHaveBeenCalled()
    })

    it("prevents judging when another official holds the lock", async () => {
      vi.mocked(prisma.attempt.findUnique).mockResolvedValue({
        ...baseAttempt,
        status: "IN_PROGRESS",
        lockedBy: "judge-1",
      } as any)

      await expect(
        AttemptService.updateAttempt(baseAttempt.id, { result: "GOOD" }, "judge-2")
      ).rejects.toThrow("Attempt is locked by another judge")
    })
  })

  describe("claimAttempt", () => {
    it("locks the next queued attempt for the requesting judge", async () => {
      vi.mocked(prisma.attempt.findFirst)
        .mockResolvedValueOnce(null as any) // no existing lock for judge
        .mockResolvedValueOnce({
          ...baseAttempt,
          status: "QUEUED",
        } as any)
      vi.mocked(prisma.attempt.updateMany).mockResolvedValue({ count: 1 } as any)
      vi.mocked(prisma.attempt.findUnique).mockResolvedValue({
        ...baseAttempt,
        status: "IN_PROGRESS",
        lockedBy: "judge-1",
      } as any)

      const attempt = await AttemptService.claimAttempt("event-1", "judge-1")

      expect(attempt?.status).toBe("IN_PROGRESS")
      expect(attempt?.lockedBy).toBe("judge-1")
      expect(prisma.attempt.updateMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          id: baseAttempt.id,
          status: "QUEUED",
        }),
        data: expect.objectContaining({
          status: "IN_PROGRESS",
          lockedBy: "judge-1",
        }),
      })
    })
  })

  describe("releaseAttemptLock", () => {
    it("returns attempt to queue", async () => {
      vi.mocked(prisma.attempt.findUnique).mockResolvedValue({
        ...baseAttempt,
        status: "IN_PROGRESS",
        lockedBy: "judge-1",
      } as any)
      vi.mocked(prisma.attempt.update).mockResolvedValue({
        ...baseAttempt,
        status: "QUEUED",
        lockedBy: null,
      } as any)

      const attempt = await AttemptService.releaseAttemptLock(baseAttempt.id, "judge-1")

      expect(attempt?.status).toBe("QUEUED")
      expect(prisma.attempt.update).toHaveBeenCalledWith({
        where: { id: baseAttempt.id },
        data: expect.objectContaining({
          status: "QUEUED",
          lockedBy: null,
        }),
        include: expect.any(Object),
      })
    })

    it("prevents releasing locks held by others", async () => {
      vi.mocked(prisma.attempt.findUnique).mockResolvedValue({
        ...baseAttempt,
        status: "IN_PROGRESS",
        lockedBy: "judge-1",
      } as any)

      await expect(
        AttemptService.releaseAttemptLock(baseAttempt.id, "judge-2")
      ).rejects.toThrow("Cannot release a lock held by another judge")
    })
  })

  describe("getCurrentAttempt", () => {
    it("returns attempt already locked by the requesting judge", async () => {
      vi.mocked(prisma.attempt.findFirst)
        .mockResolvedValueOnce({
          ...baseAttempt,
          status: "IN_PROGRESS",
          lockedBy: "judge-1",
        } as any)

      const attempt = await AttemptService.getCurrentAttempt("event-1", "judge-1")

      expect(attempt?.lockedBy).toBe("judge-1")
      expect(prisma.attempt.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ lockedBy: "judge-1" }),
        })
      )
    })
  })
})
