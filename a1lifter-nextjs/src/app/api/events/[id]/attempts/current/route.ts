import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { AttemptService } from "@/lib/services/attempt-service"

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

    // Get current attempt for the event using service
    const currentAttempt = await AttemptService.getCurrentAttempt(eventId)

    if (!currentAttempt) {
      return NextResponse.json(
        { error: "No pending attempts" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: currentAttempt,
    })
  } catch (error) {
    console.error("Error fetching current attempt:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
