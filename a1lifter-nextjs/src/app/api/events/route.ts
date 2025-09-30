import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
// TODO: Re-enable when implementing full Supabase RLS
// import { createServerSupabaseClient } from "@/lib/supabase"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // TODO: Add Supabase RLS when authentication is fully integrated
    // const supabase = await createServerSupabaseClient()
    
    // For now, return mock data since we haven't set up the database yet
    const mockEvents = [
      {
        id: "1",
        name: "Spring Powerlifting Championship",
        description: "Annual powerlifting competition",
        sport: "POWERLIFTING",
        status: "PLANNED",
        startDate: new Date("2024-04-15"),
        endDate: new Date("2024-04-16"),
        location: "City Gym",
        organizerId: session.user.id,
      },
      {
        id: "2", 
        name: "Summer Weightlifting Meet",
        description: "Regional weightlifting competition",
        sport: "WEIGHTLIFTING",
        status: "REGISTRATION_OPEN",
        startDate: new Date("2024-06-20"),
        endDate: new Date("2024-06-21"),
        location: "Olympic Center",
        organizerId: session.user.id,
      }
    ]

    return NextResponse.json({ 
      success: true, 
      data: mockEvents 
    })
  } catch (error) {
    console.error("Error fetching events:", error)
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

    const body = await request.json()
    // TODO: Add Supabase RLS when authentication is fully integrated
    // const supabase = await createServerSupabaseClient()
    
    // Mock creation for now
    const newEvent = {
      id: Date.now().toString(),
      ...body,
      organizerId: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    return NextResponse.json({ 
      success: true, 
      data: newEvent 
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating event:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}