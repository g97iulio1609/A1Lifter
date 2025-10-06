import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { calculateSinclairPoints } from "@/lib/analytics/sinclair"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id: eventId } = await params

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get("categoryId")

    // Get all good attempts for the event
    const where: {
      eventId: string
      result: "GOOD"
      categoryId?: string
    } = {
      eventId,
      result: "GOOD",
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    const attempts = await prisma.attempt.findMany({
      where,
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
      },
    })

    // Group by user and lift type, calculate totals
    type AttemptType = typeof attempts[number]
    
    const athleteScores = new Map<
      string,
      {
        userId: string
        userName: string
        categoryId: string
        categoryName: string
        gender: string
        bodyWeight: number | null
        lifts: Record<string, number>
        total: number
        attempts: AttemptType[]
        points: number | null
        sinclair: number | null
      }
    >()

    attempts.forEach((attempt: AttemptType) => {
      const key = `${attempt.userId}-${attempt.categoryId}`
      if (!athleteScores.has(key)) {
        athleteScores.set(key, {
          userId: attempt.userId,
          userName: attempt.user.name || "Unknown",
          categoryId: attempt.categoryId,
          categoryName: attempt.category.name,
          gender: attempt.category.gender,
          bodyWeight: attempt.registration?.bodyWeight ?? null,
          lifts: {} as Record<string, number>,
          total: 0,
          attempts: [],
          points: null,
          sinclair: null,
        })
      }

      const athleteScore = athleteScores.get(key)!
      
      // Keep best lift per type
      if (!athleteScore.lifts[attempt.lift] || attempt.weight > athleteScore.lifts[attempt.lift]) {
        athleteScore.lifts[attempt.lift] = attempt.weight
      }
      
      athleteScore.attempts.push(attempt)
    })

    // Calculate totals and sort
    const leaderboard = Array.from(athleteScores.values())
      .map((score) => {
        score.total = Object.values(score.lifts).reduce((sum: number, weight) => sum + (weight as number), 0)

        const genderKey = score.gender === "FEMALE" ? "FEMALE" : score.gender === "MALE" ? "MALE" : null
        if (genderKey) {
          const { coefficient, points } = calculateSinclairPoints(
            score.total,
            score.bodyWeight,
            genderKey
          )
          score.sinclair = coefficient
          score.points = points
        }

        return score
      })
      .sort((a, b) => {
        const pointsA = a.points ?? -Infinity
        const pointsB = b.points ?? -Infinity
        if (pointsA !== pointsB) {
          return pointsB - pointsA
        }
        return b.total - a.total
      })

    return NextResponse.json({
      success: true,
      data: leaderboard,
    })
  } catch (error) {
    console.error("Error fetching leaderboard:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
