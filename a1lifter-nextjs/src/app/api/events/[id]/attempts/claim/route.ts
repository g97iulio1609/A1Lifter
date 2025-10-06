import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { AttemptService } from "@/lib/services/attempt-service"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id: eventId } = await params

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "JUDGE" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const attempt = await AttemptService.claimAttempt(eventId, session.user.id)

    if (!attempt) {
      return NextResponse.json({ error: "No attempts to claim" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: attempt,
    })
  } catch (error) {
    console.error("Error claiming attempt:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
