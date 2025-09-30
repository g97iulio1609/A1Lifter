import { NextRequest, NextResponse } from 'next/server'

// Mock competition data
const competitions = [
  {
    id: 1,
    name: "Italian National Championships",
    date: "2024-03-15",
    location: "Rome, Italy",
    status: "upcoming",
    participants: 45,
    type: "powerlifting",
    federation: "FIPL",
    maxParticipants: 100,
    registrationDeadline: "2024-03-01",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    name: "Regional Strongman Cup",
    date: "2024-02-28",
    location: "Milan, Italy", 
    status: "in-progress",
    participants: 32,
    type: "strongman",
    federation: "FIPL",
    maxParticipants: 50,
    registrationDeadline: "2024-02-15",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 3,
    name: "Youth Development Meet",
    date: "2024-01-20",
    location: "Naples, Italy",
    status: "completed",
    participants: 28,
    type: "powerlifting",
    federation: "FIPL",
    maxParticipants: 40,
    registrationDeadline: "2024-01-05",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const limit = searchParams.get('limit')

    let filteredCompetitions = competitions

    // Apply filters
    if (status) {
      filteredCompetitions = filteredCompetitions.filter(comp =>
        comp.status === status
      )
    }

    if (type) {
      filteredCompetitions = filteredCompetitions.filter(comp =>
        comp.type === type
      )
    }

    // Apply limit
    if (limit) {
      const limitNum = parseInt(limit)
      if (!isNaN(limitNum)) {
        filteredCompetitions = filteredCompetitions.slice(0, limitNum)
      }
    }

    // Sort by date
    filteredCompetitions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json({
      competitions: filteredCompetitions,
      total: filteredCompetitions.length,
      message: "Competitions retrieved successfully from Next.js API"
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch competitions" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const { name, date, location, type, federation } = body
    
    if (!name || !date || !location || !type || !federation) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // In production, this would use Prisma to create the competition
    const newCompetition = {
      id: competitions.length + 1,
      name,
      date,
      location,
      type,
      federation,
      status: "upcoming" as const,
      participants: 0,
      maxParticipants: body.maxParticipants || 100,
      registrationDeadline: body.registrationDeadline || date,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Mock adding to database
    competitions.push(newCompetition)

    return NextResponse.json({
      competition: newCompetition,
      message: "Competition created successfully"
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create competition" },
      { status: 500 }
    )
  }
}