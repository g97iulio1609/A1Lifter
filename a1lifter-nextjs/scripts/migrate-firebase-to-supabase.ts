/**
 * Firebase to Supabase Migration Script
 * Issue #3: Design and migrate schema to Supabase
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'firebase-service-account.json'), 'utf8')
)

initializeApp({
  credential: cert(serviceAccount)
})

const firestore = getFirestore()

interface MigrationStats {
  users: number
  events: number
  categories: number
  registrations: number
  attempts: number
  errors: string[]
}

const stats: MigrationStats = {
  users: 0,
  events: 0,
  categories: 0,
  registrations: 0,
  attempts: 0,
  errors: []
}

/**
 * Map Firebase user roles to Prisma UserRole enum
 */
function mapUserRole(firebaseRole: string): 'ADMIN' | 'ORGANIZER' | 'JUDGE' | 'ATHLETE' {
  const roleMap: Record<string, 'ADMIN' | 'ORGANIZER' | 'JUDGE' | 'ATHLETE'> = {
    admin: 'ADMIN',
    organizer: 'ORGANIZER',
    judge: 'JUDGE',
    athlete: 'ATHLETE'
  }
  return roleMap[firebaseRole?.toLowerCase()] || 'ATHLETE'
}

/**
 * Map Firebase sport types to Prisma Sport enum
 */
function mapSport(firebaseSport: string): 'POWERLIFTING' | 'WEIGHTLIFTING' | 'STRONGMAN' | 'CROSSFIT' | 'STREETLIFTING' {
  const sportMap: Record<string, 'POWERLIFTING' | 'WEIGHTLIFTING' | 'STRONGMAN' | 'CROSSFIT' | 'STREETLIFTING'> = {
    powerlifting: 'POWERLIFTING',
    weightlifting: 'WEIGHTLIFTING',
    strongman: 'STRONGMAN',
    crossfit: 'CROSSFIT',
    streetlifting: 'STREETLIFTING'
  }
  return sportMap[firebaseSport?.toLowerCase()] || 'POWERLIFTING'
}

/**
 * Migrate Users
 */
async function migrateUsers() {
  console.log('🔄 Migrating users...')
  
  const usersSnapshot = await firestore.collection('users').get()
  
  for (const doc of usersSnapshot.docs) {
    try {
      const userData = doc.data()
      
      await prisma.user.upsert({
        where: { id: doc.id },
        update: {},
        create: {
          id: doc.id,
          email: userData.email,
          name: userData.name || userData.displayName || null,
          image: userData.photoURL || userData.image || null,
          role: mapUserRole(userData.role),
          emailVerified: userData.emailVerified ? new Date(userData.emailVerified) : null,
          isActive: userData.isActive !== false,
          createdAt: userData.createdAt?.toDate() || new Date(),
          updatedAt: userData.updatedAt?.toDate() || new Date()
        }
      })
      
      stats.users++
    } catch (error) {
      stats.errors.push(`User ${doc.id}: ${error.message}`)
      console.error(`❌ Error migrating user ${doc.id}:`, error.message)
    }
  }
  
  console.log(`✅ Migrated ${stats.users} users`)
}

/**
 * Migrate Events
 */
async function migrateEvents() {
  console.log('🔄 Migrating events...')
  
  const eventsSnapshot = await firestore.collection('events').get()
  
  for (const doc of eventsSnapshot.docs) {
    try {
      const eventData = doc.data()
      
      await prisma.event.upsert({
        where: { id: doc.id },
        update: {},
        create: {
          id: doc.id,
          name: eventData.name,
          description: eventData.description || null,
          sport: mapSport(eventData.sport || eventData.discipline),
          status: eventData.status?.toUpperCase() || 'PLANNED',
          startDate: eventData.startDate?.toDate() || new Date(),
          endDate: eventData.endDate?.toDate() || new Date(),
          location: eventData.location || 'TBD',
          maxAthletes: eventData.maxAthletes || null,
          organizerId: eventData.organizerId || eventData.createdBy,
          createdAt: eventData.createdAt?.toDate() || new Date(),
          updatedAt: eventData.updatedAt?.toDate() || new Date()
        }
      })
      
      stats.events++
    } catch (error) {
      stats.errors.push(`Event ${doc.id}: ${error.message}`)
      console.error(`❌ Error migrating event ${doc.id}:`, error.message)
    }
  }
  
  console.log(`✅ Migrated ${stats.events} events`)
}

/**
 * Migrate Categories
 */
async function migrateCategories() {
  console.log('🔄 Migrating categories...')
  
  const eventsSnapshot = await firestore.collection('events').get()
  
  for (const eventDoc of eventsSnapshot.docs) {
    const categoriesSnapshot = await firestore
      .collection('events')
      .doc(eventDoc.id)
      .collection('categories')
      .get()
    
    for (const catDoc of categoriesSnapshot.docs) {
      try {
        const catData = catDoc.data()
        
        await prisma.category.upsert({
          where: { id: catDoc.id },
          update: {},
          create: {
            id: catDoc.id,
            name: catData.name,
            gender: catData.gender?.toUpperCase() || 'MIXED',
            minWeight: catData.minWeight || catData.weightMin || null,
            maxWeight: catData.maxWeight || catData.weightMax || null,
            ageMin: catData.ageMin || null,
            ageMax: catData.ageMax || null,
            eventId: eventDoc.id,
            order: catData.order || 0,
            createdAt: catData.createdAt?.toDate() || new Date(),
            updatedAt: catData.updatedAt?.toDate() || new Date()
          }
        })
        
        stats.categories++
      } catch (error) {
        stats.errors.push(`Category ${catDoc.id}: ${error.message}`)
        console.error(`❌ Error migrating category ${catDoc.id}:`, error.message)
      }
    }
  }
  
  console.log(`✅ Migrated ${stats.categories} categories`)
}

/**
 * Migrate Registrations
 */
async function migrateRegistrations() {
  console.log('🔄 Migrating registrations...')
  
  const registrationsSnapshot = await firestore.collection('registrations').get()
  
  for (const doc of registrationsSnapshot.docs) {
    try {
      const regData = doc.data()
      
      await prisma.registration.upsert({
        where: { id: doc.id },
        update: {},
        create: {
          id: doc.id,
          userId: regData.userId || regData.athleteId,
          eventId: regData.eventId || regData.competitionId,
          categoryId: regData.categoryId || regData.weightClass,
          status: regData.status?.toUpperCase() || 'PENDING',
          bodyWeight: regData.bodyWeight || regData.weight || null,
          lot: regData.lot || regData.drawNumber || null,
          platform: regData.platform || null,
          notes: regData.notes || null,
          registeredAt: regData.registeredAt?.toDate() || regData.createdAt?.toDate() || new Date(),
          updatedAt: regData.updatedAt?.toDate() || new Date()
        }
      })
      
      stats.registrations++
    } catch (error) {
      stats.errors.push(`Registration ${doc.id}: ${error.message}`)
      console.error(`❌ Error migrating registration ${doc.id}:`, error.message)
    }
  }
  
  console.log(`✅ Migrated ${stats.registrations} registrations`)
}

/**
 * Migrate Attempts
 */
async function migrateAttempts() {
  console.log('🔄 Migrating attempts...')
  
  const attemptsSnapshot = await firestore.collection('attempts').get()
  
  for (const doc of attemptsSnapshot.docs) {
    try {
      const attemptData = doc.data()
      
      await prisma.attempt.upsert({
        where: { id: doc.id },
        update: {},
        create: {
          id: doc.id,
          userId: attemptData.userId || attemptData.athleteId,
          eventId: attemptData.eventId || attemptData.competitionId,
          categoryId: attemptData.categoryId,
          registrationId: attemptData.registrationId,
          lift: attemptData.lift?.toUpperCase() || attemptData.discipline?.toUpperCase(),
          attemptNumber: attemptData.attemptNumber || attemptData.attempt || 1,
          weight: attemptData.weight,
          result: attemptData.result?.toUpperCase() || attemptData.valid === true ? 'GOOD' : attemptData.valid === false ? 'NO_LIFT' : 'PENDING',
          judgeScores: attemptData.judgeScores || attemptData.judges || null,
          videoUrl: attemptData.videoUrl || null,
          notes: attemptData.notes || null,
          timestamp: attemptData.timestamp?.toDate() || new Date(),
          createdAt: attemptData.createdAt?.toDate() || new Date(),
          updatedAt: attemptData.updatedAt?.toDate() || new Date()
        }
      })
      
      stats.attempts++
    } catch (error) {
      stats.errors.push(`Attempt ${doc.id}: ${error.message}`)
      console.error(`❌ Error migrating attempt ${doc.id}:`, error.message)
    }
  }
  
  console.log(`✅ Migrated ${stats.attempts} attempts`)
}

/**
 * Main migration function
 */
async function main() {
  console.log('🚀 Starting Firebase to Supabase migration...\n')
  
  try {
    await migrateUsers()
    await migrateEvents()
    await migrateCategories()
    await migrateRegistrations()
    await migrateAttempts()
    
    console.log('\n📊 Migration Summary:')
    console.log(`Users: ${stats.users}`)
    console.log(`Events: ${stats.events}`)
    console.log(`Categories: ${stats.categories}`)
    console.log(`Registrations: ${stats.registrations}`)
    console.log(`Attempts: ${stats.attempts}`)
    console.log(`Errors: ${stats.errors.length}`)
    
    if (stats.errors.length > 0) {
      console.log('\n❌ Errors encountered:')
      stats.errors.forEach((error) => console.log(`  - ${error}`))
      
      // Write errors to file
      fs.writeFileSync(
        path.join(process.cwd(), 'migration-errors.log'),
        stats.errors.join('\n')
      )
      console.log('\n📝 Errors logged to migration-errors.log')
    }
    
    console.log('\n✅ Migration completed successfully!')
  } catch (error) {
    console.error('💥 Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
main()
