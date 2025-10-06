import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { AttemptService } from "@/lib/services/attempt-service"
import { JudgeAttemptSchema } from "@/lib/validations/attempts"
import { z } from "zod"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only judges can judge attempts
    if (session.user.role !== "JUDGE" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()

    // Validate request body with Zod
    const validatedData = JudgeAttemptSchema.parse(body)

    // Update attempt using service (which handles records and notifications)
    const updatedAttempt = await AttemptService.updateAttempt(id, validatedData, session.user.id)

    return NextResponse.json({
      success: true,
      data: updatedAttempt,
    })
  } catch (error) {
    console.error("Error judging attempt:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message.includes("locked")) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      )
    }
    
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
