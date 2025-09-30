import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

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

    // Only judges can judge attempts
    if (session.user.role !== "JUDGE" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()

    if (!body.result) {
      return NextResponse.json(
        { error: "Result is required" },
        { status: 400 }
      )
    }

    // Get the attempt with full details
    const attempt = await prisma.attempt.findUnique({
      where: { id },
      include: {
        user: true,
        category: true,
      },
    })

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 })
    }

    // Update attempt with judge's decision
    const updatedAttempt = await prisma.attempt.update({
      where: { id },
      data: {
        result: body.result,
        judgeScores: body.judgeScores || undefined,
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

    // If it's a good lift, check for records
    if (body.result === "GOOD") {
      // Check for personal record
      const previousBest = await prisma.attempt.findFirst({
        where: {
          userId: attempt.userId,
          lift: attempt.lift,
          result: "GOOD",
          weight: {
            lt: attempt.weight,
          },
        },
        orderBy: {
          weight: "desc",
        },
      })

      if (!previousBest || attempt.weight > previousBest.weight) {
        await prisma.record.create({
          data: {
            eventId: attempt.eventId,
            categoryId: attempt.categoryId,
            lift: attempt.lift,
            weight: attempt.weight,
            userId: attempt.userId,
            userName: attempt.user.name || "Unknown",
            recordType: "PERSONAL_RECORD",
            previousRecord: previousBest?.weight || null,
          },
        })

        // Create notification for athlete
        await prisma.notification.create({
          data: {
            userId: attempt.userId,
            type: "RESULT_POSTED",
            title: "Personal Record!",
            message: `Congratulations! You set a new personal record in ${attempt.lift}: ${attempt.weight}kg`,
            data: {
              attemptId: id,
              eventId: attempt.eventId,
              weight: attempt.weight,
              lift: attempt.lift,
            },
          },
        })
      }

      // Check for event record
      const eventRecord = await prisma.record.findFirst({
        where: {
          eventId: attempt.eventId,
          categoryId: attempt.categoryId,
          lift: attempt.lift,
          recordType: "EVENT_RECORD",
        },
        orderBy: {
          weight: "desc",
        },
      })

      if (!eventRecord || attempt.weight > eventRecord.weight) {
        await prisma.record.create({
          data: {
            eventId: attempt.eventId,
            categoryId: attempt.categoryId,
            lift: attempt.lift,
            weight: attempt.weight,
            userId: attempt.userId,
            userName: attempt.user.name || "Unknown",
            recordType: "EVENT_RECORD",
            previousRecord: eventRecord?.weight || null,
          },
        })

        // Create notification for athlete
        await prisma.notification.create({
          data: {
            userId: attempt.userId,
            type: "RESULT_POSTED",
            title: "Event Record!",
            message: `Amazing! You set a new event record in ${attempt.lift}: ${attempt.weight}kg`,
            data: {
              attemptId: id,
              eventId: attempt.eventId,
              weight: attempt.weight,
              lift: attempt.lift,
            },
          },
        })
      }
    } else {
      // Create notification for failed attempt
      await prisma.notification.create({
        data: {
          userId: attempt.userId,
          type: "RESULT_POSTED",
          title: "Attempt Result",
          message: `Your attempt in ${attempt.lift} (${attempt.weight}kg) was marked as ${body.result}`,
          data: {
            attemptId: id,
            eventId: attempt.eventId,
            result: body.result,
          },
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: updatedAttempt,
    })
  } catch (error) {
    console.error("Error judging attempt:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
