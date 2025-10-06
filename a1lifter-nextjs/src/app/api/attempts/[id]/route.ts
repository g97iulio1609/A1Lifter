import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { AttemptService } from "@/lib/services/attempt-service"
import { UpdateAttemptSchema } from "@/lib/validations/attempts"
import { prisma } from "@/lib/db"
import { z } from "zod"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get single attempt by ID directly from Prisma
    const attempt = await prisma.attempt.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            gender: true,
            minWeight: true,
            maxWeight: true,
          },
        },
      },
    })

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: attempt,
    })
  } catch (error) {
    console.error("Error fetching attempt:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

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

    const body = await request.json()

    // Validate request body with Zod
    const validatedData = UpdateAttemptSchema.parse(body)

    // Update attempt using service
    const updatedAttempt = await AttemptService.updateAttempt(id, validatedData, session.user.id)

    return NextResponse.json({
      success: true,
      data: updatedAttempt,
    })
  } catch (error) {
    console.error("Error updating attempt:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message.includes("locked")) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      )
    }
    
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins and organizers can delete attempts
    if (session.user.role !== "ADMIN" && session.user.role !== "ORGANIZER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await AttemptService.deleteAttempt(id)

    return NextResponse.json({
      success: true,
      message: "Attempt deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting attempt:", error)

    if (error instanceof Error && error.message.includes("Cannot delete")) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
