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
    const { id } = await params

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "JUDGE" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const attempt = await AttemptService.releaseAttemptLock(id, session.user.id)

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not locked" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: attempt,
    })
  } catch (error) {
    console.error("Error releasing attempt lock:", error)

    if (error instanceof Error && error.message.includes("another judge")) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
