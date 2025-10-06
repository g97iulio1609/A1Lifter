import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { captureException } from "@/lib/observability"
import { cache, cacheKeys } from "@/lib/cache"
import { Profiler } from "@/lib/performance"

export const dynamic = "force-dynamic"

export async function GET() {
  const profiler = new Profiler("dashboard-stats")

  try {
    profiler.mark("start")
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    profiler.mark("auth-complete")

    // Try to get from cache first
    const cacheKey = cacheKeys.dashboard()
    const cached = cache.get(cacheKey)

    if (cached) {
      profiler.measure("cache-hit", "start")
      profiler.logSummary()
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true,
      })
    }

    profiler.mark("cache-miss")

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

    profiler.mark("queries-complete")
    profiler.measure("database-queries", "cache-miss", "queries-complete")

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

    // Cache for 5 minutes
    cache.set(cacheKey, stats, 300)

    profiler.measure("total", "start")
    profiler.logSummary()

    return NextResponse.json({
      success: true,
      data: stats,
      cached: false,
    })
  } catch (error) {
    captureException(error, { tags: { route: "dashboard/stats" } })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
