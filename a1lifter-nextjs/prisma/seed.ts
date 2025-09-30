/**
 * Database Seed Script
 * Creates initial admin user and sample data for development
 */

import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...\n')

  // Create Admin User
  console.log('👤 Creating admin user...')
  const hashedPassword = await bcrypt.hash('Admin123!', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@a1lifter.com' },
    update: {},
    create: {
      email: 'admin@a1lifter.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      emailVerified: new Date(),
      isActive: true,
    }
  })
  console.log(`✅ Admin created: ${admin.email}`)

  // Create Organizer User
  console.log('\n👤 Creating organizer user...')
  const organizer = await prisma.user.upsert({
    where: { email: 'organizer@a1lifter.com' },
    update: {},
    create: {
      email: 'organizer@a1lifter.com',
      password: hashedPassword,
      name: 'Event Organizer',
      role: 'ORGANIZER',
      emailVerified: new Date(),
      isActive: true,
    }
  })
  console.log(`✅ Organizer created: ${organizer.email}`)

  // Create Judge Users
  console.log('\n👤 Creating judge users...')
  const judges = await Promise.all([
    prisma.user.upsert({
      where: { email: 'judge1@a1lifter.com' },
      update: {},
      create: {
        email: 'judge1@a1lifter.com',
        password: hashedPassword,
        name: 'Head Judge',
        role: 'JUDGE',
        emailVerified: new Date(),
        isActive: true,
      }
    }),
    prisma.user.upsert({
      where: { email: 'judge2@a1lifter.com' },
      update: {},
      create: {
        email: 'judge2@a1lifter.com',
        password: hashedPassword,
        name: 'Side Judge 1',
        role: 'JUDGE',
        emailVerified: new Date(),
        isActive: true,
      }
    }),
    prisma.user.upsert({
      where: { email: 'judge3@a1lifter.com' },
      update: {},
      create: {
        email: 'judge3@a1lifter.com',
        password: hashedPassword,
        name: 'Side Judge 2',
        role: 'JUDGE',
        emailVerified: new Date(),
        isActive: true,
      }
    })
  ])
  console.log(`✅ Created ${judges.length} judges`)

  // Create Athlete Users
  console.log('\n👤 Creating athlete users...')
  const athletes = await Promise.all([
    prisma.user.upsert({
      where: { email: 'athlete1@a1lifter.com' },
      update: {},
      create: {
        email: 'athlete1@a1lifter.com',
        password: hashedPassword,
        name: 'John Strongman',
        role: 'ATHLETE',
        emailVerified: new Date(),
        isActive: true,
      }
    }),
    prisma.user.upsert({
      where: { email: 'athlete2@a1lifter.com' },
      update: {},
      create: {
        email: 'athlete2@a1lifter.com',
        password: hashedPassword,
        name: 'Jane Powerlifter',
        role: 'ATHLETE',
        emailVerified: new Date(),
        isActive: true,
      }
    }),
    prisma.user.upsert({
      where: { email: 'athlete3@a1lifter.com' },
      update: {},
      create: {
        email: 'athlete3@a1lifter.com',
        password: hashedPassword,
        name: 'Mike Deadlifter',
        role: 'ATHLETE',
        emailVerified: new Date(),
        isActive: true,
      }
    }),
    prisma.user.upsert({
      where: { email: 'athlete4@a1lifter.com' },
      update: {},
      create: {
        email: 'athlete4@a1lifter.com',
        password: hashedPassword,
        name: 'Sarah Weightlifter',
        role: 'ATHLETE',
        emailVerified: new Date(),
        isActive: true,
      }
    })
  ])
  console.log(`✅ Created ${athletes.length} athletes`)

  // Create Sample Events
  console.log('\n🏆 Creating sample events...')
  
  const powerliftingEvent = await prisma.event.create({
    data: {
      name: 'National Powerlifting Championship 2025',
      description: 'Annual national powerlifting competition featuring the best athletes from across the country.',
      sport: 'POWERLIFTING',
      status: 'REGISTRATION_OPEN',
      startDate: new Date('2025-12-15'),
      endDate: new Date('2025-12-17'),
      location: 'Rome Convention Center',
      maxAthletes: 100,
      organizerId: organizer.id,
    }
  })
  console.log(`✅ Created event: ${powerliftingEvent.name}`)

  const weightliftingEvent = await prisma.event.create({
    data: {
      name: 'Italian Weightlifting Cup 2025',
      description: 'Olympic weightlifting competition sanctioned by IWF.',
      sport: 'WEIGHTLIFTING',
      status: 'PLANNED',
      startDate: new Date('2026-01-20'),
      endDate: new Date('2026-01-21'),
      location: 'Milan Sports Arena',
      maxAthletes: 80,
      organizerId: organizer.id,
    }
  })
  console.log(`✅ Created event: ${weightliftingEvent.name}`)

  // Create Categories for Powerlifting Event
  console.log('\n📋 Creating categories...')
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Men Open -83kg',
        gender: 'MALE',
        minWeight: 74.0,
        maxWeight: 83.0,
        eventId: powerliftingEvent.id,
        order: 1,
      }
    }),
    prisma.category.create({
      data: {
        name: 'Men Open -93kg',
        gender: 'MALE',
        minWeight: 83.0,
        maxWeight: 93.0,
        eventId: powerliftingEvent.id,
        order: 2,
      }
    }),
    prisma.category.create({
      data: {
        name: 'Women Open -63kg',
        gender: 'FEMALE',
        minWeight: 57.0,
        maxWeight: 63.0,
        eventId: powerliftingEvent.id,
        order: 3,
      }
    }),
    prisma.category.create({
      data: {
        name: 'Women Open -72kg',
        gender: 'FEMALE',
        minWeight: 63.0,
        maxWeight: 72.0,
        eventId: powerliftingEvent.id,
        order: 4,
      }
    })
  ])
  console.log(`✅ Created ${categories.length} categories`)

  // Create Event Sessions
  console.log('\n🗓️  Creating event sessions...')
  const sessions = await Promise.all([
    prisma.eventSession.create({
      data: {
        name: 'Day 1 - Morning Session',
        eventId: powerliftingEvent.id,
        startTime: new Date('2025-12-15T09:00:00'),
        endTime: new Date('2025-12-15T13:00:00'),
        order: 1,
      }
    }),
    prisma.eventSession.create({
      data: {
        name: 'Day 1 - Afternoon Session',
        eventId: powerliftingEvent.id,
        startTime: new Date('2025-12-15T15:00:00'),
        endTime: new Date('2025-12-15T19:00:00'),
        order: 2,
      }
    }),
    prisma.eventSession.create({
      data: {
        name: 'Day 2 - Morning Session',
        eventId: powerliftingEvent.id,
        startTime: new Date('2025-12-16T09:00:00'),
        endTime: new Date('2025-12-16T13:00:00'),
        order: 3,
      }
    })
  ])
  console.log(`✅ Created ${sessions.length} sessions`)

  // Create Registrations
  console.log('\n📝 Creating registrations...')
  const registrations = await Promise.all([
    prisma.registration.create({
      data: {
        userId: athletes[0].id,
        eventId: powerliftingEvent.id,
        categoryId: categories[0].id,
        status: 'APPROVED',
        bodyWeight: 82.5,
        lot: 1,
        platform: 'A',
      }
    }),
    prisma.registration.create({
      data: {
        userId: athletes[1].id,
        eventId: powerliftingEvent.id,
        categoryId: categories[2].id,
        status: 'APPROVED',
        bodyWeight: 62.0,
        lot: 2,
        platform: 'A',
      }
    }),
    prisma.registration.create({
      data: {
        userId: athletes[2].id,
        eventId: powerliftingEvent.id,
        categoryId: categories[1].id,
        status: 'APPROVED',
        bodyWeight: 92.0,
        lot: 3,
        platform: 'B',
      }
    }),
    prisma.registration.create({
      data: {
        userId: athletes[3].id,
        eventId: powerliftingEvent.id,
        categoryId: categories[3].id,
        status: 'PENDING',
        bodyWeight: 71.5,
        lot: 4,
      }
    })
  ])
  console.log(`✅ Created ${registrations.length} registrations`)

  // Create Judge Assignments
  console.log('\n⚖️  Creating judge assignments...')
  const judgeAssignments = await Promise.all([
    prisma.judgeAssignment.create({
      data: {
        userId: judges[0].id,
        eventId: powerliftingEvent.id,
        role: 'HEAD_JUDGE',
        platform: 'A',
      }
    }),
    prisma.judgeAssignment.create({
      data: {
        userId: judges[1].id,
        eventId: powerliftingEvent.id,
        role: 'SIDE_JUDGE',
        platform: 'A',
      }
    }),
    prisma.judgeAssignment.create({
      data: {
        userId: judges[2].id,
        eventId: powerliftingEvent.id,
        role: 'SIDE_JUDGE',
        platform: 'B',
      }
    })
  ])
  console.log(`✅ Created ${judgeAssignments.length} judge assignments`)

  // Create Sample Attempts
  console.log('\n🏋️  Creating sample attempts...')
  const attempts = await Promise.all([
    prisma.attempt.create({
      data: {
        userId: athletes[0].id,
        eventId: powerliftingEvent.id,
        categoryId: categories[0].id,
        registrationId: registrations[0].id,
        lift: 'SQUAT',
        attemptNumber: 1,
        weight: 200.0,
        result: 'GOOD',
        judgeScores: { judge1: 'GOOD', judge2: 'GOOD', judge3: 'GOOD' },
      }
    }),
    prisma.attempt.create({
      data: {
        userId: athletes[0].id,
        eventId: powerliftingEvent.id,
        categoryId: categories[0].id,
        registrationId: registrations[0].id,
        lift: 'SQUAT',
        attemptNumber: 2,
        weight: 210.0,
        result: 'GOOD',
        judgeScores: { judge1: 'GOOD', judge2: 'GOOD', judge3: 'GOOD' },
      }
    }),
    prisma.attempt.create({
      data: {
        userId: athletes[1].id,
        eventId: powerliftingEvent.id,
        categoryId: categories[2].id,
        registrationId: registrations[1].id,
        lift: 'SQUAT',
        attemptNumber: 1,
        weight: 120.0,
        result: 'GOOD',
        judgeScores: { judge1: 'GOOD', judge2: 'GOOD', judge3: 'NO_LIFT' },
      }
    })
  ])
  console.log(`✅ Created ${attempts.length} attempts`)

  // Create Notifications
  console.log('\n🔔 Creating sample notifications...')
  const notifications = await Promise.all([
    prisma.notification.create({
      data: {
        userId: athletes[0].id,
        type: 'REGISTRATION_APPROVED',
        title: 'Registration Approved',
        message: `Your registration for ${powerliftingEvent.name} has been approved!`,
        data: { eventId: powerliftingEvent.id },
      }
    }),
    prisma.notification.create({
      data: {
        userId: athletes[1].id,
        type: 'REGISTRATION_APPROVED',
        title: 'Registration Approved',
        message: `Your registration for ${powerliftingEvent.name} has been approved!`,
        data: { eventId: powerliftingEvent.id },
      }
    }),
    prisma.notification.create({
      data: {
        userId: athletes[3].id,
        type: 'EVENT_UPDATE',
        title: 'Registration Pending',
        message: 'Your registration is being reviewed by the organizer.',
        data: { eventId: powerliftingEvent.id },
      }
    })
  ])
  console.log(`✅ Created ${notifications.length} notifications`)

  console.log('\n✅ Database seed completed successfully!')
  console.log('\n📋 Summary:')
  console.log(`   - Users: ${1 + 1 + judges.length + athletes.length}`)
  console.log(`   - Events: 2`)
  console.log(`   - Categories: ${categories.length}`)
  console.log(`   - Sessions: ${sessions.length}`)
  console.log(`   - Registrations: ${registrations.length}`)
  console.log(`   - Judge Assignments: ${judgeAssignments.length}`)
  console.log(`   - Attempts: ${attempts.length}`)
  console.log(`   - Notifications: ${notifications.length}`)
  console.log('\n🔑 Login Credentials:')
  console.log('   Admin:     admin@a1lifter.com / Admin123!')
  console.log('   Organizer: organizer@a1lifter.com / Admin123!')
  console.log('   Judge:     judge1@a1lifter.com / Admin123!')
  console.log('   Athlete:   athlete1@a1lifter.com / Admin123!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
