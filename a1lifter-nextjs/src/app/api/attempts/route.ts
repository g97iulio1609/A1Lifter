import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { AttemptService } from "@/lib/services/attempt-service"
import { CreateAttemptSchema } from "@/lib/validations/attempts"
import { z } from "zod"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Validate request body with Zod
    const validatedData = CreateAttemptSchema.parse(body)

    // Create attempt using service
    const newAttempt = await AttemptService.createAttempt(validatedData)

    return NextResponse.json(
      {
        success: true,
        data: newAttempt,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating attempt:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      )
    }
    
    if (error instanceof Error && error.message.includes("already exists")) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
