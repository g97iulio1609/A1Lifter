import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { calculateSinclairPoints } from "@/lib/analytics/sinclair"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Number(searchParams.get("limit") || 5)

    const attempts = await prisma.attempt.findMany({
      where: {
        result: "GOOD",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            gender: true,
          },
        },
        registration: {
          select: {
            bodyWeight: true,
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            startDate: true,
          },
        },
      },
    })

    type AggregateKey = string

    const aggregates = new Map<
      AggregateKey,
      {
        userId: string
        userName: string
        eventId: string
        eventName: string
        categoryName: string
        gender: string
        bodyWeight: number | null
        bestSnatch: number
        bestCleanAndJerk: number
        total: number
        points: number | null
        sinclair: number | null
        attemptIds: string[]
      }
    >()

    attempts.forEach((attempt) => {
      if (!attempt.user) return

      const key = `${attempt.userId}:${attempt.eventId}`
      if (!aggregates.has(key)) {
        aggregates.set(key, {
          userId: attempt.userId,
          userName: attempt.user.name || "Unknown",
          eventId: attempt.eventId,
          eventName: attempt.event.name,
          categoryName: attempt.category?.name || "—",
          gender: attempt.category?.gender || "OTHER",
          bodyWeight: attempt.registration?.bodyWeight ?? null,
          bestSnatch: 0,
          bestCleanAndJerk: 0,
          total: 0,
          points: null,
          sinclair: null,
          attemptIds: [],
        })
      }

      const aggregate = aggregates.get(key)!
      aggregate.attemptIds.push(attempt.id)

      if (attempt.lift === "SNATCH") {
        aggregate.bestSnatch = Math.max(aggregate.bestSnatch, attempt.weight)
      }

      if (attempt.lift === "CLEAN_AND_JERK") {
        aggregate.bestCleanAndJerk = Math.max(aggregate.bestCleanAndJerk, attempt.weight)
      }
    })

    const lifters = Array.from(aggregates.values())
      .map((entry) => {
        if (entry.bestSnatch === 0 || entry.bestCleanAndJerk === 0) {
          return null
        }

        entry.total = entry.bestSnatch + entry.bestCleanAndJerk

        const genderKey = entry.gender === "FEMALE" ? "FEMALE" : entry.gender === "MALE" ? "MALE" : null
        if (genderKey) {
          const { coefficient, points } = calculateSinclairPoints(
            entry.total,
            entry.bodyWeight,
            genderKey
          )
          entry.sinclair = coefficient
          entry.points = points
        }

        return entry
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry && entry.total > 0))
      .sort((a, b) => {
        const pointsA = a.points ?? -Infinity
        const pointsB = b.points ?? -Infinity
        if (pointsA !== pointsB) {
          return pointsB - pointsA
        }
        return b.total - a.total
      })
      .slice(0, Math.max(1, limit))

    return NextResponse.json({
      success: true,
      data: lifters,
    })
  } catch (error) {
    console.error("Error fetching top lifters:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
