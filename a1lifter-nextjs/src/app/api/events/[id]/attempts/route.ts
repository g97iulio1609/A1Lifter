import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { AttemptService } from "@/lib/services/attempt-service"
import { z } from "zod"

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
    const userId = searchParams.get("userId") || undefined
    const lift = searchParams.get("lift") as "SNATCH" | "CLEAN_AND_JERK" | undefined
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : undefined

    // Use service to get attempts
    const result = await AttemptService.getAttempts({
      eventId,
      userId,
      lift,
      limit,
      offset,
    })

    return NextResponse.json({
      success: true,
      data: result.attempts,
      meta: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        hasMore: result.hasMore,
      },
    })
  } catch (error) {
    console.error("Error fetching attempts:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
