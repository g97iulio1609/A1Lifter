/**
 * Health Check API Endpoint
 * Production monitoring and status checking
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  uptime: number
  services: {
    database: {
      status: 'operational' | 'degraded' | 'down'
      latency?: number
    }
    auth: {
      status: 'operational' | 'degraded' | 'down'
    }
    storage: {
      status: 'operational' | 'degraded' | 'down'
    }
  }
  version: string
  environment: string
}

export async function GET() {
  const startTime = Date.now()
  const health: HealthCheckResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: { status: 'operational' },
      auth: { status: 'operational' },
      storage: { status: 'operational' }
    },
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  }

  try {
    // Check database connectivity
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const dbLatency = Date.now() - dbStart
    
    health.services.database = {
      status: dbLatency < 100 ? 'operational' : dbLatency < 500 ? 'degraded' : 'down',
      latency: dbLatency
    }

    // Check if database is too slow
    if (dbLatency > 500) {
      health.status = 'degraded'
    }
  } catch (error) {
    console.error('Database health check failed:', error)
    health.services.database = {
      status: 'down'
    }
    health.status = 'unhealthy'
  }

  // Check authentication service
  try {
    // Simple check if NextAuth environment variables are set
    if (!process.env.NEXTAUTH_SECRET || !process.env.NEXTAUTH_URL) {
      health.services.auth.status = 'degraded'
      health.status = health.status === 'unhealthy' ? 'unhealthy' : 'degraded'
    }
  } catch (error) {
    console.error('Auth health check failed:', error)
    health.services.auth.status = 'down'
    health.status = 'unhealthy'
  }

  // Check storage service (Supabase)
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      health.services.storage.status = 'degraded'
      health.status = health.status === 'unhealthy' ? 'unhealthy' : 'degraded'
    }
  } catch (error) {
    console.error('Storage health check failed:', error)
    health.services.storage.status = 'down'
    health.status = 'unhealthy'
  }

  const responseTime = Date.now() - startTime

  // Return appropriate status code
  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503

  return NextResponse.json(
    {
      ...health,
      responseTime
    },
    { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    }
  )
}

// Simple ping endpoint for basic monitoring
export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}
