import { NextRequest, NextResponse } from 'next/server'

// Mock live session data
const liveSession = {
  id: "session_1",
  competitionId: "competition_2",
  competitionName: "Regional Strongman Cup",
  status: "active",
  currentAthlete: {
    id: 1,
    name: "Marco Rossi",
    category: "M 83kg"
  },
  currentDiscipline: "Squat",
  currentAttempt: 2,
  currentWeight: 225,
  platform: "Platform 1",
  timer: {
    timeRemaining: 90,
    isActive: true,
    startedAt: new Date().toISOString()
  },
  judgeVotes: [
    { judgeId: 1, position: "Left", vote: "valid" },
    { judgeId: 2, position: "Center", vote: "valid" },
    { judgeId: 3, position: "Right", vote: "invalid" }
  ],
  leaderboard: [
    {
      rank: 1,
      athleteId: 3,
      name: "Andrea Ferrari",
      category: "M 93kg",
      squat: 240,
      bench: 170,
      deadlift: 300,
      total: 710,
      wilks: 445.2
    },
    {
      rank: 2,
      athleteId: 1,
      name: "Marco Rossi", 
      category: "M 83kg",
      squat: 220,
      bench: 150,
      deadlift: 280,
      total: 650,
      wilks: 442.8
    },
    {
      rank: 3,
      athleteId: 2,
      name: "Sofia Bianchi",
      category: "F 63kg",
      squat: 140,
      bench: 85,
      deadlift: 180,
      total: 405,
      wilks: 441.5
    }
  ],
  nextAthletes: [
    { name: "Giuseppe Verdi", discipline: "Squat", attempt: 1, weight: 200 },
    { name: "Francesca Rossi", discipline: "Squat", attempt: 3, weight: 145 }
  ],
  updatedAt: new Date().toISOString()
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const competitionId = searchParams.get('competitionId')

    // In production, this would fetch from Supabase with real-time subscriptions
    const sessionData = {
      ...liveSession,
      // Simulate real-time updates
      timer: {
        ...liveSession.timer,
        timeRemaining: Math.max(0, liveSession.timer.timeRemaining - Math.floor(Math.random() * 10))
      },
      message: "Live session data retrieved successfully from Next.js API with Supabase real-time simulation"
    }

    if (competitionId && competitionId !== liveSession.competitionId) {
      return NextResponse.json({
        session: null,
        message: "No active session for this competition"
      })
    }

    return NextResponse.json({
      session: sessionData,
      isLive: true,
      connectionStatus: "connected"
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch live session" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    switch (action) {
      case "start_timer":
        // In production, this would update Supabase and trigger real-time updates
        liveSession.timer.isActive = true
        liveSession.timer.timeRemaining = data.duration || 90
        liveSession.timer.startedAt = new Date().toISOString()
        break

      case "pause_timer":
        liveSession.timer.isActive = false
        break

      case "reset_timer":
        liveSession.timer.isActive = false
        liveSession.timer.timeRemaining = 90
        break

      case "submit_vote":
        // Update judge vote
        const judgeIndex = liveSession.judgeVotes.findIndex(
          v => v.judgeId === data.judgeId
        )
        if (judgeIndex !== -1) {
          liveSession.judgeVotes[judgeIndex].vote = data.vote
        }
        break

      case "next_attempt":
        // Move to next attempt/athlete
        liveSession.currentAttempt += 1
        if (liveSession.currentAttempt > 3) {
          liveSession.currentAttempt = 1
          // Would advance to next athlete in production
        }
        break

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        )
    }

    liveSession.updatedAt = new Date().toISOString()

    return NextResponse.json({
      session: liveSession,
      message: `Action '${action}' executed successfully`,
      action
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update live session" },
      { status: 500 }
    )
  }
}