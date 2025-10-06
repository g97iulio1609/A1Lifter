import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get("eventId")

  // Build query
  const where: { eventId?: string } = {}
    if (eventId) {
      where.eventId = eventId
    }

    const registrations = await prisma.registration.findMany({
      where,
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
            sport: true,
            startDate: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            gender: true,
          },
        },
        _count: {
          select: {
            attempts: true,
          },
        },
      },
      orderBy: {
        registeredAt: "desc",
      },
    })

    return NextResponse.json({
      success: true,
      data: registrations,
    })
  } catch (error) {
    console.error("Error fetching registrations:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.eventId || !body.categoryId) {
      return NextResponse.json(
        { error: "Event ID and Category ID are required" },
        { status: 400 }
      )
    }

    const userId = body.userId || session.user.id

    // Check if already registered
    const existingRegistration = await prisma.registration.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId: body.eventId,
        },
      },
    })

    if (existingRegistration) {
      return NextResponse.json(
        { error: "Already registered for this event" },
        { status: 400 }
      )
    }

    // Check event capacity
    const event = await prisma.event.findUnique({
      where: { id: body.eventId },
      include: {
        _count: {
          select: {
            registrations: {
              where: {
                status: "APPROVED",
              },
            },
          },
        },
      },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

  type RegistrationStatusValue = "PENDING" | "APPROVED" | "REJECTED" | "WAITLIST"
  let registrationStatus: RegistrationStatusValue = "PENDING"
    
    // Auto-approve if no max or under capacity
    if (!event.maxAthletes || event._count.registrations < event.maxAthletes) {
      registrationStatus = "APPROVED"
    } else {
      registrationStatus = "WAITLIST"
    }

    // Create registration
    const newRegistration = await prisma.registration.create({
      data: {
        userId,
        eventId: body.eventId,
        categoryId: body.categoryId,
        status: registrationStatus,
        bodyWeight: body.bodyWeight,
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

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId,
        type: registrationStatus === "APPROVED" ? "REGISTRATION_APPROVED" : "EVENT_UPDATE",
        title: registrationStatus === "APPROVED" ? "Registration Approved" : "Registration Received",
        message: `Your registration for ${event.name} has been ${registrationStatus.toLowerCase()}.`,
        data: {
          eventId: body.eventId,
          registrationId: newRegistration.id,
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: newRegistration,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating registration:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
