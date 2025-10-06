/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
vi.mock("@/lib/db", () => ({
  prisma: {
    notification: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}))

import { PATCH as patchNotification } from "@/app/api/notifications/[id]/route"
import { PATCH as patchAllNotifications } from "@/app/api/notifications/mark-all/route"
import { prisma } from "@/lib/db"

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(() =>
    Promise.resolve({
      user: { id: "user-1", role: "ATHLETE" },
    })
  ),
}))

const mockNotification = {
  id: "notification-1",
  userId: "user-1",
  isRead: false,
  readAt: null,
  title: "Test",
  message: "Message",
  type: "SYSTEM",
  createdAt: new Date().toISOString(),
  data: null,
}

describe("/api/notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("PATCH /api/notifications/:id", () => {
    it("marks a notification as read by default", async () => {
      vi.mocked(prisma.notification.findUnique).mockResolvedValue(mockNotification as any)
      vi.mocked(prisma.notification.update).mockResolvedValue({
        ...mockNotification,
        isRead: true,
        readAt: new Date().toISOString(),
      } as any)

      const response = await patchNotification(
        new NextRequest("http://localhost:3000/api/notifications/notification-1", {
          method: "PATCH",
        }),
        { params: Promise.resolve({ id: "notification-1" }) }
      )

      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.data.isRead).toBe(true)
    })

    it("returns 404 when notification missing", async () => {
      vi.mocked(prisma.notification.findUnique).mockResolvedValue(null)

      const response = await patchNotification(
        new NextRequest("http://localhost:3000/api/notifications/notification-1", {
          method: "PATCH",
        }),
        { params: Promise.resolve({ id: "notification-1" }) }
      )

      expect(response.status).toBe(404)
    })

    it("validates request body", async () => {
      vi.mocked(prisma.notification.findUnique).mockResolvedValue(mockNotification as any)

      const response = await patchNotification(
        new NextRequest("http://localhost:3000/api/notifications/notification-1", {
          method: "PATCH",
          body: "{ \"isRead\": \"yes\" }",
        }),
        { params: Promise.resolve({ id: "notification-1" }) }
      )

      expect(response.status).toBe(400)
    })
  })

  describe("PATCH /api/notifications/mark-all", () => {
    it("marks all unread notifications", async () => {
      vi.mocked(prisma.notification.updateMany).mockResolvedValue({ count: 3 } as any)

      const response = await patchAllNotifications(
        new NextRequest("http://localhost:3000/api/notifications/mark-all", {
          method: "PATCH",
        })
      )

      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.data.updated).toBe(3)
    })
  })
})
