import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    // Execute all queries in parallel
    const [
      totalAthletes,
      activeCompetitions,
      todayAttempts,
      recordsBrokenThisWeek,
      totalEvents,
      upcomingEvents,
      completedEvents,
      totalRegistrations,
      pendingApprovals,
    ] = await Promise.all([
      // Total active athletes
      prisma.user.count({
        where: {
          isActive: true,
          role: "ATHLETE",
        },
      }),
      // Active competitions
      prisma.event.count({
        where: {
          status: "IN_PROGRESS",
          isDeleted: false,
        },
      }),
      // Today's results
      prisma.attempt.count({
        where: {
          timestamp: {
            gte: today,
          },
          result: {
            in: ["GOOD", "NO_LIFT"],
          },
        },
      }),
      // Records broken this week
      prisma.record.count({
        where: {
          setAt: {
            gte: weekAgo,
          },
        },
      }),
      // Total events
      prisma.event.count({
        where: {
          isDeleted: false,
        },
      }),
      // Upcoming events
      prisma.event.count({
        where: {
          startDate: {
            gte: new Date(),
          },
          status: {
            in: ["PLANNED", "REGISTRATION_OPEN", "REGISTRATION_CLOSED"],
          },
          isDeleted: false,
        },
      }),
      // Completed events
      prisma.event.count({
        where: {
          status: "COMPLETED",
          isDeleted: false,
        },
      }),
      // Total registrations
      prisma.registration.count(),
      // Pending approvals
      prisma.registration.count({
        where: {
          status: "PENDING",
        },
      }),
    ])

    const stats = {
      totalAthletes,
      activeCompetitions,
      todayResults: todayAttempts,
      recordsBroken: recordsBrokenThisWeek,
      totalEvents,
      upcomingEvents,
      completedEvents,
      totalRegistrations,
      pendingApprovals,
    }

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
