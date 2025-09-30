import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
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

    // Get athlete statistics
    const [
      totalRegistrations,
      approvedRegistrations,
      totalAttempts,
      goodLifts,
      personalRecords,
      bestLifts,
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
      // Total attempts
      prisma.attempt.count({
        where: { userId: id },
      }),
      // Good lifts
      prisma.attempt.count({
        where: {
          userId: id,
          result: "GOOD",
        },
      }),
      // Personal records
      prisma.record.count({
        where: {
          userId: id,
          recordType: "PERSONAL_RECORD",
        },
      }),
      // Best lifts by type
      prisma.attempt.groupBy({
        by: ["lift"],
        where: {
          userId: id,
          result: "GOOD",
        },
        _max: {
          weight: true,
        },
      }),
    ])

    const stats = {
      totalRegistrations,
      approvedRegistrations,
      totalAttempts,
      goodLifts,
      failedLifts: totalAttempts - goodLifts,
      successRate: totalAttempts > 0 ? (goodLifts / totalAttempts) * 100 : 0,
      personalRecords,
      bestLifts: bestLifts.reduce(
        (acc: Record<string, number>, lift: { lift: string; _max: { weight: number | null } }) => {
          acc[lift.lift] = lift._max.weight || 0
          return acc
        },
        {} as Record<string, number>
      ),
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
