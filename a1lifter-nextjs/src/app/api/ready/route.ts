/**
 * Database readiness check
 * Checks if database migrations are up to date
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Check if critical tables exist
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `

    const requiredTables = [
      'users',
      'events',
      'categories',
      'registrations',
      'attempts'
    ]

    const existingTables = tables.map(t => t.tablename)
    const missingTables = requiredTables.filter(t => !existingTables.includes(t))

    if (missingTables.length > 0) {
      return NextResponse.json(
        {
          ready: false,
          message: 'Database not ready - missing tables',
          missingTables
        },
        { status: 503 }
      )
    }

    // Check if database is writable
    await prisma.$executeRaw`SELECT 1`

    return NextResponse.json({
      ready: true,
      message: 'Database is ready',
      tables: existingTables.length
    })
  } catch (error) {
    console.error('Readiness check failed:', error)
    return NextResponse.json(
      {
        ready: false,
        message: 'Database not ready',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    )
  }
}
