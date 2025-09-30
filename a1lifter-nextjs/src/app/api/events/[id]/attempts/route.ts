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
    const { id: eventId } = await params

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    // Build query
    const where: any = { eventId }
    if (userId) {
      where.userId = userId
    }

    const attempts = await prisma.attempt.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
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
            id: true,
            lot: true,
            platform: true,
            bodyWeight: true,
          },
        },
      },
      orderBy: [
        { timestamp: "desc" },
        { attemptNumber: "asc" },
      ],
    })

    return NextResponse.json({
      success: true,
      data: attempts,
    })
  } catch (error) {
    console.error("Error fetching attempts:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
