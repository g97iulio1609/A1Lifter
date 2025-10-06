import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

const CreateCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  gender: z.enum(["MALE", "FEMALE", "MIXED", "OTHER"]),
  minWeight: z.number().positive().optional(),
  maxWeight: z.number().positive().optional(),
  ageMin: z.number().int().positive().optional(),
  ageMax: z.number().int().positive().optional(),
  order: z.number().int().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id: eventId } = await params

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "ORGANIZER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId, isDeleted: false },
      select: { organizerId: true },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    if (session.user.role !== "ADMIN" && event.organizerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const payload = CreateCategorySchema.safeParse(body)

    if (!payload.success) {
      return NextResponse.json(
        { error: "Validation error", details: payload.error.flatten() },
        { status: 400 }
      )
    }

    const category = await prisma.category.create({
      data: {
        ...payload.data,
        eventId,
      },
    })

    return NextResponse.json({
      success: true,
      data: category,
    })
  } catch (error) {
    console.error("Error creating category:", error)

    if (typeof error === "object" && error && (error as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Category name already exists" }, { status: 409 })
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
