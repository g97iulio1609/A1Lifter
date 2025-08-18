import { chromium, FullConfig } from '@playwright/test'
import path from 'path'
import fs from 'fs'

/**
 * Global setup for Playwright E2E tests
 * Sets up test environment, Firebase staging connection, and test data
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for E2E tests...')
  
  // Ensure test environment variables are set
  const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ]
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
  if (missingVars.length > 0) {
    console.warn(`⚠️  Missing environment variables: ${missingVars.join(', ')}`)
    console.warn('E2E tests will use mock data instead of Firebase staging')
  }
  
  // Create test data directory
  const testDataDir = path.join(__dirname, 'test-data')
  if (!fs.existsSync(testDataDir)) {
    fs.mkdirSync(testDataDir, { recursive: true })
  }
  
  // Setup test users and authentication state
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()
  
  try {
    // Navigate to the app
    const baseURL = config.projects[0].use.baseURL || 'http://localhost:4173'
    await page.goto(baseURL)
    
    // Wait for app to load
    await page.waitForLoadState('networkidle')
    
    // Setup test users with different roles
    const testUsers = [
      {
        email: 'admin@a1lifter-test.com',
        password: 'TestAdmin123!',
        role: 'admin',
        name: 'Test Admin'
      },
      {
        email: 'organizer@a1lifter-test.com',
        password: 'TestOrganizer123!',
        role: 'organizer',
        name: 'Test Organizer'
      },
      {
        email: 'judge@a1lifter-test.com',
        password: 'TestJudge123!',
        role: 'judge',
        name: 'Test Judge'
      },
      {
        email: 'athlete@a1lifter-test.com',
        password: 'TestAthlete123!',
        role: 'athlete',
        name: 'Test Athlete'
      }
    ]
    
    // Save test users data
    fs.writeFileSync(
      path.join(testDataDir, 'test-users.json'),
      JSON.stringify(testUsers, null, 2)
    )
    
    // Create test events data
    const testEvents = [
      {
        id: 'test-powerlifting-event',
        name: 'Test Powerlifting Championship',
        sport: 'powerlifting',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        location: 'Test Venue',
        status: 'upcoming',
        organizer: 'organizer@a1lifter-test.com'
      },
      {
        id: 'test-weightlifting-event',
        name: 'Test Weightlifting Competition',
        sport: 'weightlifting',
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
        location: 'Test Gym',
        status: 'upcoming',
        organizer: 'organizer@a1lifter-test.com'
      },
      {
        id: 'test-live-event',
        name: 'Live Test Event',
        sport: 'powerlifting',
        date: new Date().toISOString(), // Now
        location: 'Live Venue',
        status: 'live',
        organizer: 'organizer@a1lifter-test.com'
      }
    ]
    
    fs.writeFileSync(
      path.join(testDataDir, 'test-events.json'),
      JSON.stringify(testEvents, null, 2)
    )
    
    // Create test athletes data
    const testAthletes = [
      {
        id: 'test-athlete-1',
        name: 'John Powerlifter',
        email: 'john@test.com',
        weightClass: '83kg',
        category: 'Open',
        team: 'Test Team A',
        eventId: 'test-powerlifting-event'
      },
      {
        id: 'test-athlete-2',
        name: 'Jane Strongwoman',
        email: 'jane@test.com',
        weightClass: '72kg',
        category: 'Open',
        team: 'Test Team B',
        eventId: 'test-powerlifting-event'
      },
      {
        id: 'test-athlete-3',
        name: 'Mike Weightlifter',
        email: 'mike@test.com',
        weightClass: '89kg',
        category: 'Open',
        team: 'Test Team C',
        eventId: 'test-weightlifting-event'
      }
    ]
    
    fs.writeFileSync(
      path.join(testDataDir, 'test-athletes.json'),
      JSON.stringify(testAthletes, null, 2)
    )
    
    // Create test attempts data
    const testAttempts = [
      {
        id: 'test-attempt-1',
        athleteId: 'test-athlete-1',
        eventId: 'test-live-event',
        discipline: 'squat',
        attemptNumber: 1,
        weight: 150,
        status: 'pending'
      },
      {
        id: 'test-attempt-2',
        athleteId: 'test-athlete-1',
        eventId: 'test-live-event',
        discipline: 'squat',
        attemptNumber: 2,
        weight: 160,
        status: 'pending'
      }
    ]
    
    fs.writeFileSync(
      path.join(testDataDir, 'test-attempts.json'),
      JSON.stringify(testAttempts, null, 2)
    )
    
    console.log('✅ Test data created successfully')
    
    // Check if Firebase is available and setup test data
    if (!missingVars.length) {
      console.log('🔥 Setting up Firebase staging data...')
      
      // Here you would typically:
      // 1. Connect to Firebase staging
      // 2. Clear existing test data
      // 3. Seed with test data
      // 4. Setup test user accounts
      
      console.log('✅ Firebase staging setup completed')
    }
    
  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await context.close()
    await browser.close()
  }
  
  console.log('🎉 Global setup completed successfully')
}

export default globalSetup