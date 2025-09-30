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

    const registrations = await prisma.registration.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            sport: true,
            status: true,
            startDate: true,
            endDate: true,
            location: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            gender: true,
          },
        },
        _count: {
          select: {
            attempts: true,
          },
        },
      },
      orderBy: {
        registeredAt: "desc",
      },
    })

    return NextResponse.json({
      success: true,
      data: registrations,
    })
  } catch (error) {
    console.error("Error fetching user registrations:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
