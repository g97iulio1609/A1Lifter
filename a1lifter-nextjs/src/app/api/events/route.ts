import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch events from database
    const events = await prisma.event.findMany({
      where: {
        isDeleted: false
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        categories: true,
        _count: {
          select: {
            registrations: true
          }
        }
      },
      orderBy: {
        startDate: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: events
    })
  } catch (error) {
    console.error("Error fetching events:", error)
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
    if (!body.name || !body.sport || !body.startDate || !body.endDate || !body.location) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Create event in database
    const newEvent = await prisma.event.create({
      data: {
        name: body.name,
        description: body.description,
        sport: body.sport,
        status: body.status || 'PLANNED',
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        location: body.location,
        maxAthletes: body.maxAthletes,
        organizerId: body.organizerId || session.user.id,
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: newEvent
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating event:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}