import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins and organizers can view all athletes
    if (session.user.role !== "ADMIN" && session.user.role !== "ORGANIZER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const athletes = await prisma.user.findMany({
      where: {
        isActive: true,
      },
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
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({
      success: true,
      data: athletes,
    })
  } catch (error) {
    console.error("Error fetching athletes:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins and organizers can create athletes
    if (session.user.role !== "ADMIN" && session.user.role !== "ORGANIZER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.email || !body.name) {
      return NextResponse.json(
        { error: "Email and name are required" },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      )
    }

    // Hash password if provided
    let hashedPassword = null
    if (body.password) {
      hashedPassword = await bcrypt.hash(body.password, 10)
    }

    // Create athlete
    const newAthlete = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        password: hashedPassword,
        role: body.role || "ATHLETE",
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: newAthlete,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating athlete:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
