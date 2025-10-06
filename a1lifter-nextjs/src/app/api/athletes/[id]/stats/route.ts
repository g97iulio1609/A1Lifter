import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { AttemptService } from "@/lib/services/attempt-service"
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

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get("eventId") || undefined

    // Use service to get athlete attempts with summary
    let attemptData
    if (eventId) {
      attemptData = await AttemptService.getAthleteAttempts(eventId, id)
    }

    // Get additional registration and record statistics
    const [
      totalRegistrations,
      approvedRegistrations,
      personalRecords,
    ] = await Promise.all([
      // Total registrations
      prisma.registration.count({
        where: { userId: id },
      }),
      // Approved registrations
      prisma.registration.count({
        where: {
          userId: id,
          status: "APPROVED",
        },
      }),
      // Personal records
      prisma.record.count({
        where: {
          userId: id,
          recordType: "PERSONAL_RECORD",
        },
      }),
    ])

    // Calculate overall attempt statistics if no event specified
    let totalAttempts = 0
    let goodLifts = 0
    let bestLifts = {}

    if (attemptData) {
      totalAttempts = attemptData.attempts.length
      goodLifts = attemptData.attempts.filter(a => a.result === "GOOD").length
      bestLifts = {
        SNATCH: attemptData.summary.bestSnatch,
        CLEAN_AND_JERK: attemptData.summary.bestCleanJerk,
        total: attemptData.summary.total,
      }
    } else {
      // Calculate from all events
      const allAttempts = await prisma.attempt.count({
        where: { userId: id },
      })
      const allGoodLifts = await prisma.attempt.count({
        where: {
          userId: id,
          result: "GOOD",
        },
      })
      const allBestLifts = await prisma.attempt.groupBy({
        by: ["lift"],
        where: {
          userId: id,
          result: "GOOD",
        },
        _max: {
          weight: true,
        },
      })
      
      totalAttempts = allAttempts
      goodLifts = allGoodLifts
      bestLifts = allBestLifts.reduce(
        (acc: Record<string, number>, lift) => {
          acc[lift.lift] = lift._max.weight || 0
          return acc
        },
        {}
      )
    }

    const stats = {
      totalRegistrations,
      approvedRegistrations,
      totalAttempts,
      goodLifts,
      failedLifts: totalAttempts - goodLifts,
      successRate: totalAttempts > 0 ? (goodLifts / totalAttempts) * 100 : 0,
      personalRecords,
      bestLifts,
      ...(attemptData && {
        eventSummary: attemptData.summary,
      }),
    }

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error("Error fetching athlete stats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
