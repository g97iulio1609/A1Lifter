import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    if (
      !body.userId ||
      !body.eventId ||
      !body.categoryId ||
      !body.registrationId ||
      !body.lift ||
      body.attemptNumber === undefined ||
      !body.weight
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if attempt already exists
    const existingAttempt = await prisma.attempt.findUnique({
      where: {
        userId_eventId_lift_attemptNumber: {
          userId: body.userId,
          eventId: body.eventId,
          lift: body.lift,
          attemptNumber: body.attemptNumber,
        },
      },
    })

    if (existingAttempt) {
      return NextResponse.json(
        { error: "Attempt already exists" },
        { status: 400 }
      )
    }

    // Create attempt
    const newAttempt = await prisma.attempt.create({
      data: {
        userId: body.userId,
        eventId: body.eventId,
        categoryId: body.categoryId,
        registrationId: body.registrationId,
        lift: body.lift,
        attemptNumber: body.attemptNumber,
        weight: body.weight,
        result: "PENDING",
        notes: body.notes,
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

    return NextResponse.json(
      {
        success: true,
        data: newAttempt,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating attempt:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
