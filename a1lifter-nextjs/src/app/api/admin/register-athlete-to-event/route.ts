import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins and organizers can register athletes manually
    if (session.user.role !== "ADMIN" && session.user.role !== "ORGANIZER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.email || !body.name || !body.eventId || !body.categoryId) {
      return NextResponse.json(
        { error: "Email, name, event ID, and category ID are required" },
        { status: 400 }
      )
    }

    let userId: string
    let temporaryPassword: string | null = null
    let isNewUser = false

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    })

    if (existingUser) {
      // User exists, use their ID
      userId = existingUser.id
    } else {
      // Create new user with temporary password
      temporaryPassword = randomBytes(8).toString('hex') // Generate 16-char temp password
      const hashedPassword = await bcrypt.hash(temporaryPassword, 10)

      const newUser = await prisma.user.create({
        data: {
          email: body.email,
          name: body.name,
          password: hashedPassword,
          role: "ATHLETE",
          isActive: true,
          mustChangePassword: true, // Force password change on first login
        },
      })

      userId = newUser.id
      isNewUser = true
    }

    // Check if already registered for this event
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
        { error: "This athlete is already registered for this event" },
        { status: 400 }
      )
    }

    // Get event details
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
    let registrationStatus: RegistrationStatusValue = "APPROVED" // Admin registrations are auto-approved

    // Check capacity
    if (event.maxAthletes && event._count.registrations >= event.maxAthletes) {
      registrationStatus = "WAITLIST"
    }

    // Create registration
    const registration = await prisma.registration.create({
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
        type: "REGISTRATION_APPROVED",
        title: "You've been registered for an event",
        message: isNewUser
          ? `You've been registered for ${event.name}. Check your email for login credentials.`
          : `You've been registered for ${event.name} by an administrator.`,
        data: {
          eventId: body.eventId,
          registrationId: registration.id,
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          registration,
          isNewUser,
          temporaryPassword: temporaryPassword, // Return temp password to show to admin
          userEmail: body.email,
        },
        message: isNewUser
          ? "New athlete account created and registered for event"
          : "Existing athlete registered for event",
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error registering athlete to event:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
