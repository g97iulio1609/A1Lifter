import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { AttemptService } from "@/lib/services/attempt-service"
import { AttemptQuerySchema } from "@/lib/validations/attempts"
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

    const queryParams = {
      eventId,
      userId: searchParams.get("userId") || undefined,
      categoryId: searchParams.get("categoryId") || undefined,
      lift: searchParams.get("lift") || undefined,
      result: searchParams.get("result") || undefined,
      status: searchParams.get("status") || undefined,
      limit: searchParams.get("limit") || undefined,
      offset: searchParams.get("offset") || undefined,
    }

    const parsedQuery = AttemptQuerySchema.parse(queryParams)

    // Use service to get attempts
    const result = await AttemptService.getAttempts(parsedQuery)

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
