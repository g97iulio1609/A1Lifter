import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { AttemptService } from "@/lib/services/attempt-service"
import { uploadAttemptVideo } from "@/lib/storage"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const attempt = await AttemptService.getAttemptById(id)

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 })
    }

    const canManage =
      session.user.role === "ADMIN" ||
      session.user.role === "ORGANIZER" ||
      session.user.role === "JUDGE" ||
      attempt.userId === session.user.id

    if (!canManage) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get("file")

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Missing file" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)
    const extension = file.name?.split(".").pop() || "mp4"
    const timestamp = Date.now()
    const generatedName = `${attempt.id}-${timestamp}.${extension}`

    const uploadResult = await uploadAttemptVideo({
      attemptId: attempt.id,
      eventId: attempt.eventId,
      userId: attempt.userId,
      fileName: generatedName,
      fileBuffer,
      contentType: file.type || "video/mp4",
    })

    const updatedAttempt = await AttemptService.attachVideo(attempt.id, uploadResult.publicUrl)

    return NextResponse.json({
      success: true,
      data: updatedAttempt,
      url: uploadResult.publicUrl,
    })
  } catch (error) {
    console.error("Error uploading attempt video:", error)

    if (error instanceof Error && error.message.includes("Supabase")) {
      return NextResponse.json({ error: "Storage configuration error" }, { status: 500 })
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
