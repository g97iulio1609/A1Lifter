import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

const PatchSchema = z.object({
  isRead: z.boolean().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const notification = await prisma.notification.findUnique({
      where: { id },
    })

    if (!notification || notification.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const body = await request
      .json()
      .catch(() => null as { isRead?: boolean } | null)

    let payload: { isRead?: boolean } | undefined

    if (body) {
      try {
        payload = PatchSchema.parse(body)
      } catch (err) {
        if (err instanceof z.ZodError) {
          return NextResponse.json(
            { error: "Validation error", details: err.issues },
            { status: 400 }
          )
        }
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
      }
    }

    const isRead = payload?.isRead ?? true

    const updated = await prisma.notification.update({
      where: { id },
      data: {
        isRead,
        readAt: isRead ? new Date() : null,
      },
    })

    return NextResponse.json({
      success: true,
      data: updated,
    })
  } catch (error) {
    console.error("Error updating notification:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
