/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { POST as createCategory } from "@/app/api/events/[id]/categories/route"
import { DELETE as deleteCategory } from "@/app/api/events/[id]/categories/[categoryId]/route"
import { prisma } from "@/lib/db"

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(() =>
    Promise.resolve({
      user: { id: "organizer-1", role: "ORGANIZER" },
    })
  ),
}))

vi.mock("@/lib/db", () => ({
  prisma: {
    event: {
      findUnique: vi.fn(),
    },
    category: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

describe("Category management", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("creates a category", async () => {
    vi.mocked(prisma.event.findUnique).mockResolvedValue({ organizerId: "organizer-1", isDeleted: false } as any) // eslint-disable-line @typescript-eslint/no-explicit-any
    vi.mocked(prisma.category.create).mockResolvedValue({ id: "cat-1", name: "Women 71" } as any) // eslint-disable-line @typescript-eslint/no-explicit-any

    const response = await createCategory(
      new NextRequest("http://localhost:3000/api/events/event-1/categories", {
        method: "POST",
        body: JSON.stringify({ name: "Women 71", gender: "FEMALE" }),
      }),
      { params: Promise.resolve({ id: "event-1" }) }
    )

    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data.data.name).toBe("Women 71")
  })

  it("deletes a category", async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue({ id: "cat-1", eventId: "event-1" } as any) // eslint-disable-line @typescript-eslint/no-explicit-any
    vi.mocked(prisma.event.findUnique).mockResolvedValue({ organizerId: "organizer-1", isDeleted: false } as any) // eslint-disable-line @typescript-eslint/no-explicit-any

    const response = await deleteCategory(
      new NextRequest("http://localhost:3000/api/events/event-1/categories/cat-1", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ id: "event-1", categoryId: "cat-1" }) }
    )

    expect(response.status).toBe(200)
    expect(prisma.category.delete).toHaveBeenCalledWith({ where: { id: "cat-1" } })
  })
})
