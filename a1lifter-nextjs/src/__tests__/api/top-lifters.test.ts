/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { GET as topLiftersHandler } from "@/app/api/analytics/top-lifters/route"

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(() =>
    Promise.resolve({
      user: { id: "admin-1", role: "ADMIN" },
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

describe("/api/analytics/top-lifters", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns aggregated lifters", async () => {
    const { prisma } = await import("@/lib/db")
    vi.mocked(prisma.attempt.findMany).mockResolvedValue([
      {
        id: "a1",
        userId: "u1",
        eventId: "e1",
        lift: "SNATCH",
        weight: 120,
        result: "GOOD",
        user: { id: "u1", name: "Taylor" },
        category: { id: "c1", name: "Men 89", gender: "MALE" },
        registration: { bodyWeight: 88 },
        event: { id: "e1", name: "Open", startDate: new Date().toISOString() },
      },
      {
        id: "a2",
        userId: "u1",
        eventId: "e1",
        lift: "CLEAN_AND_JERK",
        weight: 150,
        result: "GOOD",
        user: { id: "u1", name: "Taylor" },
        category: { id: "c1", name: "Men 89", gender: "MALE" },
        registration: { bodyWeight: 88 },
        event: { id: "e1", name: "Open", startDate: new Date().toISOString() },
      },
    ] as any)

    const response = await topLiftersHandler(
      new NextRequest("http://localhost:3000/api/analytics/top-lifters"),
    )

    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data.data.length).toBe(1)
    expect(data.data[0].points).not.toBeNull()
  })
})
