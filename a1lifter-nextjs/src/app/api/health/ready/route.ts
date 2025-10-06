import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

/**
 * Readiness check endpoint
 * GET /api/health/ready
 * Used by orchestrators (k8s, docker-compose) to determine if app is ready to receive traffic
 */
export async function GET() {
  try {
    // Check if database is accessible
    await prisma.$queryRaw`SELECT 1`

    return NextResponse.json(
      {
        status: "ready",
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        status: "not ready",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}
