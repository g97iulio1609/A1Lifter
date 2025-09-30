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

    const registration = await prisma.registration.findUnique({
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
        attempts: {
          orderBy: {
            timestamp: "asc",
          },
        },
      },
    })

    if (!registration) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: registration,
    })
  } catch (error) {
    console.error("Error fetching registration:", error)
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

    // Only admins and organizers can update registrations
    if (session.user.role !== "ADMIN" && session.user.role !== "ORGANIZER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()

    const updatedRegistration = await prisma.registration.update({
      where: { id },
      data: {
        status: body.status,
        bodyWeight: body.bodyWeight,
        lot: body.lot,
        platform: body.platform,
        notes: body.notes,
      },
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
      data: updatedRegistration,
    })
  } catch (error) {
    console.error("Error updating registration:", error)
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

    const registration = await prisma.registration.findUnique({
      where: { id },
    })

    if (!registration) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      )
    }

    // Users can delete their own registrations, admins/organizers can delete any
    if (
      registration.userId !== session.user.id &&
      session.user.role !== "ADMIN" &&
      session.user.role !== "ORGANIZER"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.registration.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: "Registration deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting registration:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
