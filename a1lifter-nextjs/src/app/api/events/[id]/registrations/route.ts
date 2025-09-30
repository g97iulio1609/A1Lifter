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

    const registrations = await prisma.registration.findMany({
      where: { eventId },
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
        attempts: {
          orderBy: {
            timestamp: "desc",
          },
          take: 5,
        },
      },
      orderBy: [
        { status: "asc" },
        { registeredAt: "desc" },
      ],
    })

    return NextResponse.json({
      success: true,
      data: registrations,
    })
  } catch (error) {
    console.error("Error fetching registrations:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
