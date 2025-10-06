import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

function getStartDate(days: number) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const start = new Date(now)
  start.setDate(start.getDate() - (days - 1))
  return start
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const days = Math.min(30, Math.max(7, Number(searchParams.get("days") ?? 14)))

    const since = getStartDate(days)

    const attempts = await prisma.attempt.findMany({
      where: {
        timestamp: {
          gte: since,
        },
      },
      select: {
        id: true,
        timestamp: true,
        result: true,
        weight: true,
        lift: true,
        userId: true,
        category: {
          select: {
            gender: true,
          },
        },
      },
    })

    const dailyMap = new Map<
      string,
      { date: string; total: number; good: number; noLift: number; disqualified: number }
    >()
    const liftMap = new Map<string, { totalWeight: number; count: number }>()
    const resultMap = new Map<string, number>()
    const genderParticipants = new Map<string, Set<string>>()

    attempts.forEach((attempt) => {
      const dayKey = attempt.timestamp.toISOString().slice(0, 10)
      if (!dailyMap.has(dayKey)) {
        dailyMap.set(dayKey, {
          date: dayKey,
          total: 0,
          good: 0,
          noLift: 0,
          disqualified: 0,
        })
      }

      const daily = dailyMap.get(dayKey)!
      daily.total += 1
      if (attempt.result === "GOOD") daily.good += 1
      if (attempt.result === "NO_LIFT") daily.noLift += 1
      if (attempt.result === "DISQUALIFIED") daily.disqualified += 1

      const liftData = liftMap.get(attempt.lift) ?? { totalWeight: 0, count: 0 }
      if (attempt.result === "GOOD") {
        liftData.totalWeight += attempt.weight
        liftData.count += 1
      }
      liftMap.set(attempt.lift, liftData)

      resultMap.set(attempt.result, (resultMap.get(attempt.result) ?? 0) + 1)

      const genderKey = attempt.category?.gender ?? "UNSPECIFIED"
      const genderSet = genderParticipants.get(genderKey) ?? new Set<string>()
      genderSet.add(attempt.userId)
      genderParticipants.set(genderKey, genderSet)
    })

    const attemptsPerDay = Array.from(dailyMap.values()).sort((a, b) => (a.date < b.date ? -1 : 1))

    const liftAverages = Array.from(liftMap.entries()).map(([lift, data]) => ({
      lift,
      average: data.count > 0 ? Number((data.totalWeight / data.count).toFixed(2)) : 0,
    }))

    const resultDistribution = Array.from(resultMap.entries()).map(([result, count]) => ({
      result,
      count,
    }))

    const participationByGender = Array.from(genderParticipants.entries()).map(([gender, participants]) => ({
      gender,
      athletes: participants.size,
    }))

    return NextResponse.json({
      success: true,
      data: {
        attemptsPerDay,
        liftAverages,
        resultDistribution,
        participationByGender,
      },
    })
  } catch (error) {
    console.error("Error building analytics trends:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
