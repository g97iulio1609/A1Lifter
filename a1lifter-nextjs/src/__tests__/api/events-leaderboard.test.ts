import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { GET as leaderboardHandler } from "@/app/api/events/[id]/leaderboard/route"

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(() =>
    Promise.resolve({
      user: { id: "user-1", role: "ADMIN" },
    })
  ),
}))

vi.mock("@/lib/db", () => ({
  prisma: {
    attempt: {
      findMany: vi.fn(),
    },
  },
}))

const mockAttempts = [
  {
    id: "attempt-1",
    userId: "athlete-1",
    eventId: "event-1",
    categoryId: "cat-1",
    lift: "SNATCH",
    weight: 100,
    result: "GOOD",
    user: { id: "athlete-1", name: "Alex" },
    category: { id: "cat-1", name: "Women 71", gender: "FEMALE" },
    registration: { bodyWeight: 70 },
  },
  {
    id: "attempt-2",
    userId: "athlete-1",
    eventId: "event-1",
    categoryId: "cat-1",
    lift: "CLEAN_AND_JERK",
    weight: 125,
    result: "GOOD",
    user: { id: "athlete-1", name: "Alex" },
    category: { id: "cat-1", name: "Women 71", gender: "FEMALE" },
    registration: { bodyWeight: 70 },
  },
]

describe("/api/events/[id]/leaderboard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns sinclair points", async () => {
    const { prisma } = await import("@/lib/db")
    vi.mocked(prisma.attempt.findMany).mockResolvedValue(mockAttempts as any) // eslint-disable-line @typescript-eslint/no-explicit-any

    const response = await leaderboardHandler(
      new NextRequest("http://localhost:3000/api/events/event-1/leaderboard"),
      { params: Promise.resolve({ id: "event-1" }) }
    )

    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data.data[0].points).toBeDefined()
    expect(data.data[0].sinclair).toBeDefined()
  })
})
