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

    const records = await prisma.record.findMany({
      where: { eventId },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            gender: true,
          },
        },
      },
      orderBy: {
        setAt: "desc",
      },
    })

    return NextResponse.json({
      success: true,
      data: records,
    })
  } catch (error) {
    console.error("Error fetching event records:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
