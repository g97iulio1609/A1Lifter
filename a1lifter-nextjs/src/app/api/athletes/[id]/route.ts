import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const athlete = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            registrations: true,
            attempts: true,
            organizedEvents: true,
          },
        },
      },
    })

    if (!athlete) {
      return NextResponse.json({ error: "Athlete not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: athlete,
    })
  } catch (error) {
    console.error("Error fetching athlete:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

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

    // Users can update their own profile, admins/organizers can update anyone
    if (
      session.user.id !== id &&
      session.user.role !== "ADMIN" &&
      session.user.role !== "ORGANIZER"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()

    // Prepare update data
    const updateData: any = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.email !== undefined) updateData.email = body.email
    if (body.isActive !== undefined && session.user.role === "ADMIN") {
      updateData.isActive = body.isActive
    }
    if (body.role !== undefined && session.user.role === "ADMIN") {
      updateData.role = body.role
    }

    // Hash password if provided
    if (body.password) {
      updateData.password = await bcrypt.hash(body.password, 10)
    }

    const updatedAthlete = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedAthlete,
    })
  } catch (error) {
    console.error("Error updating athlete:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins can delete users
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Soft delete by setting isActive to false
    await prisma.user.update({
      where: { id },
      data: {
        isActive: false,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Athlete deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting athlete:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
