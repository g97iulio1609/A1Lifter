import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; categoryId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id: eventId, categoryId } = await params

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "ORGANIZER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { eventId: true },
    })

    if (!category || category.eventId !== eventId) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true, isDeleted: true },
    })

    if (!event || event.isDeleted) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    if (session.user.role !== "ADMIN" && event.organizerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.category.delete({ where: { id: categoryId } })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error("Error deleting category:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
