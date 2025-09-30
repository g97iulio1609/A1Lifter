import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

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
        event: true,
        category: true,
        registration: true,
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

    const updatedAttempt = await prisma.attempt.update({
      where: { id },
      data: {
        weight: body.weight,
        result: body.result,
        notes: body.notes,
        videoUrl: body.videoUrl,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        event: {
          select: {
            id: true,
            name: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedAttempt,
    })
  } catch (error) {
    console.error("Error updating attempt:", error)
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

    await prisma.attempt.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: "Attempt deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting attempt:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
