import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { POST } from "@/app/api/attempts/route"
import { POST as claimAttemptHandler } from "@/app/api/events/[id]/attempts/claim/route"
import { POST as releaseAttemptHandler } from "@/app/api/attempts/[id]/release/route"
import { prisma } from "@/lib/db"
import { AttemptService } from "@/lib/services/attempt-service"

vi.mock("@/lib/db", () => ({
  prisma: {
    attempt: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    registration: {
      findUnique: vi.fn(),
    },
    event: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(() => Promise.resolve({
    user: { id: "user-1", role: "JUDGE" },
  })),
}))

describe("/api/attempts", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("POST /api/attempts", () => {
    it("should create a new attempt", async () => {
      const newAttempt = {
        userId: "athlete-1",
        eventId: "event-1",
        categoryId: "cat-1",
        registrationId: "reg-1",
        lift: "SNATCH",
        weight: 100,
        attemptNumber: 1,
      }

      const createdAttempt = {
        id: "attempt-1",
        ...newAttempt,
        result: "PENDING",
        status: "QUEUED",
        notes: null,
        createdAt: new Date(),
        user: { id: "athlete-1", name: "John Doe" },
        event: { id: "event-1", name: "Test Event" },
        category: { id: "cat-1", name: "M73" },
        registration: { id: "reg-1", lot: 1, platform: "A", bodyWeight: 73 },
      }

      vi.mocked(prisma.attempt.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.registration.findUnique).mockResolvedValue({
        id: "reg-1",
        status: "APPROVED",
      } as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      vi.mocked(prisma.event.findUnique).mockResolvedValue({
        id: "event-1",
        status: "IN_PROGRESS",
      } as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      vi.mocked(prisma.attempt.create).mockResolvedValue(createdAttempt as any) // eslint-disable-line @typescript-eslint/no-explicit-any

      const request = new NextRequest("http://localhost:3000/api/attempts", {
        method: "POST",
        body: JSON.stringify(newAttempt),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.weight).toBe(100)
      expect(prisma.attempt.create).toHaveBeenCalled()
    })

    it("should validate required fields", async () => {
      vi.mocked(prisma.attempt.findUnique).mockResolvedValue(null)
      const invalidData = {
        userId: "athlete-1",
        // Missing eventId, categoryId, lift, weight, attemptNumber
      }

      const request = new NextRequest("http://localhost:3000/api/attempts", {
        method: "POST",
        body: JSON.stringify(invalidData),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it("should prevent duplicate attempts", async () => {
      const newAttempt = {
        userId: "athlete-1",
        eventId: "event-1",
        categoryId: "cat-1",
        registrationId: "reg-1",
        lift: "SNATCH",
        weight: 100,
        attemptNumber: 1,
      }

      const existingAttempt = {
        id: "attempt-1",
        ...newAttempt,
        result: "GOOD",
        createdAt: new Date(),
      }

      vi.mocked(prisma.attempt.findUnique).mockResolvedValue(existingAttempt as any) // eslint-disable-line @typescript-eslint/no-explicit-any

      const request = new NextRequest("http://localhost:3000/api/attempts", {
        method: "POST",
        body: JSON.stringify(newAttempt),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain("already exists")
    })
  })

  describe("POST /api/events/[id]/attempts/claim", () => {
    it("returns claimed attempt", async () => {
      const claimed = {
        id: "attempt-1",
        eventId: "event-1",
        lockedBy: "user-1",
        status: "IN_PROGRESS",
      }

      const spy = vi
        .spyOn(AttemptService, "claimAttempt")
        .mockResolvedValue(claimed as any) // eslint-disable-line @typescript-eslint/no-explicit-any

      const response = await claimAttemptHandler(
        new NextRequest("http://localhost:3000/api/events/event-1/attempts/claim", {
          method: "POST",
        }),
        { params: Promise.resolve({ id: "event-1" }) }
      )

      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.data.id).toBe("attempt-1")
      expect(spy).toHaveBeenCalledWith("event-1", "user-1")

      spy.mockRestore()
    })

    it("returns 404 when queue empty", async () => {
      vi.spyOn(AttemptService, "claimAttempt").mockResolvedValue(null)

      const response = await claimAttemptHandler(
        new NextRequest("http://localhost:3000/api/events/event-1/attempts/claim", {
          method: "POST",
        }),
        { params: Promise.resolve({ id: "event-1" }) }
      )

      expect(response.status).toBe(404)
    })
  })

  describe("POST /api/attempts/[id]/release", () => {
    it("releases attempt lock", async () => {
      const released = {
        id: "attempt-1",
        eventId: "event-1",
        status: "QUEUED",
        lockedBy: null,
      }

      const spy = vi
        .spyOn(AttemptService, "releaseAttemptLock")
        .mockResolvedValue(released as any) // eslint-disable-line @typescript-eslint/no-explicit-any

      const response = await releaseAttemptHandler(
        new NextRequest("http://localhost:3000/api/attempts/attempt-1/release", {
          method: "POST",
        }),
        { params: Promise.resolve({ id: "attempt-1" }) }
      )

      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.data.status).toBe("QUEUED")
      expect(spy).toHaveBeenCalledWith("attempt-1", "user-1")

      spy.mockRestore()
    })

    it("propagates service errors", async () => {
      const spy = vi.spyOn(AttemptService, "releaseAttemptLock").mockRejectedValueOnce(
        new Error("Cannot release a lock held by another judge")
      )

      const response = await releaseAttemptHandler(
        new NextRequest("http://localhost:3000/api/attempts/attempt-1/release", {
          method: "POST",
        }),
        { params: Promise.resolve({ id: "attempt-1" }) }
      )

      expect(response.status).toBe(403)

      spy.mockRestore()
    })
  })
})
