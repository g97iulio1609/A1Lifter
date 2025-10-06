import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/**
 * Liveness check endpoint
 * GET /api/health/live
 * Used by orchestrators to determine if app process is alive
 * Should always return 200 if process is running
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "alive",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      },
    },
    { status: 200 }
  )
}
