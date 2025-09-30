import { NextRequest, NextResponse } from 'next/server'

// Mock data for demonstration - in production this would come from Supabase/Prisma
const athletes = [
  {
    id: 1,
    name: "Marco Rossi",
    email: "marco.rossi@email.com",
    gender: "M" as const,
    weightClass: "83kg",
    federation: "FIPL",
    personalBests: { squat: 220, bench: 150, deadlift: 280 },
    total: 650,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    name: "Sofia Bianchi",
    email: "sofia.bianchi@email.com",
    gender: "F" as const,
    weightClass: "63kg",
    federation: "FIPL",
    personalBests: { squat: 140, bench: 85, deadlift: 180 },
    total: 405,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 3,
    name: "Andrea Ferrari",
    email: "andrea.ferrari@email.com",
    gender: "M" as const,
    weightClass: "93kg",
    federation: "FIPL",
    personalBests: { squat: 240, bench: 170, deadlift: 300 },
    total: 710,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const gender = searchParams.get('gender')
    const weightClass = searchParams.get('weightClass')

    let filteredAthletes = athletes

    // Apply filters
    if (search) {
      filteredAthletes = filteredAthletes.filter(athlete =>
        athlete.name.toLowerCase().includes(search.toLowerCase()) ||
        athlete.email.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (gender) {
      filteredAthletes = filteredAthletes.filter(athlete =>
        athlete.gender === gender
      )
    }

    if (weightClass) {
      filteredAthletes = filteredAthletes.filter(athlete =>
        athlete.weightClass === weightClass
      )
    }

    return NextResponse.json({
      athletes: filteredAthletes,
      total: filteredAthletes.length,
      message: "Athletes retrieved successfully from Next.js API"
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch athletes" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const { name, email, gender, weightClass, federation } = body
    
    if (!name || !email || !gender || !weightClass || !federation) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // In production, this would use Prisma to create the athlete
    const newAthlete = {
      id: athletes.length + 1,
      name,
      email,
      gender,
      weightClass,
      federation,
      personalBests: body.personalBests || { squat: 0, bench: 0, deadlift: 0 },
      total: body.total || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Mock adding to database
    athletes.push(newAthlete)

    return NextResponse.json({
      athlete: newAthlete,
      message: "Athlete created successfully"
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create athlete" },
      { status: 500 }
    )
  }
}