import { Page, expect } from '@playwright/test'
import path from 'path'
import fs from 'fs'

/**
 * Test data utilities for E2E tests
 * Handles creation, retrieval, and management of test data
 */

interface TestEvent {
  id: string
  name: string
  sport: string
  date: string
  location: string
  status: 'upcoming' | 'live' | 'completed'
  organizer: string
}

interface TestAthlete {
  id: string
  name: string
  email: string
  weightClass: string
  category: string
  team: string
  eventId: string
}

interface TestAttempt {
  id: string
  athleteId: string
  eventId: string
  discipline: string
  attemptNumber: number
  weight: number
  status: 'pending' | 'valid' | 'invalid' | 'passed'
}

/**
 * Get test events data
 */
export function getTestEvents(): TestEvent[] {
  const testDataPath = path.join(__dirname, '..', 'test-data', 'test-events.json')
  
  if (!fs.existsSync(testDataPath)) {
    // Fallback test events if file doesn't exist
    return [
      {
        id: 'test-powerlifting-event',
        name: 'Test Powerlifting Championship',
        sport: 'powerlifting',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Test Venue',
        status: 'upcoming',
        organizer: 'organizer@a1lifter-test.com'
      },
      {
        id: 'test-live-event',
        name: 'Live Test Event',
        sport: 'powerlifting',
        date: new Date().toISOString(),
        location: 'Live Venue',
        status: 'live',
        organizer: 'organizer@a1lifter-test.com'
      }
    ]
  }
  
  return JSON.parse(fs.readFileSync(testDataPath, 'utf-8'))
}

/**
 * Get test athletes data
 */
export function getTestAthletes(): TestAthlete[] {
  const testDataPath = path.join(__dirname, '..', 'test-data', 'test-athletes.json')
  
  if (!fs.existsSync(testDataPath)) {
    // Fallback test athletes if file doesn't exist
    return [
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
      }
    ]
  }
  
  return JSON.parse(fs.readFileSync(testDataPath, 'utf-8'))
}

/**
 * Get test attempts data
 */
export function getTestAttempts(): TestAttempt[] {
  const testDataPath = path.join(__dirname, '..', 'test-data', 'test-attempts.json')
  
  if (!fs.existsSync(testDataPath)) {
    // Fallback test attempts if file doesn't exist
    return [
      {
        id: 'test-attempt-1',
        athleteId: 'test-athlete-1',
        eventId: 'test-live-event',
        discipline: 'squat',
        attemptNumber: 1,
        weight: 150,
        status: 'pending'
      }
    ]
  }
  
  return JSON.parse(fs.readFileSync(testDataPath, 'utf-8'))
}

/**
 * Get test event by ID
 */
export function getTestEventById(id: string): TestEvent | undefined {
  const events = getTestEvents()
  return events.find(event => event.id === id)
}

/**
 * Get test athlete by ID
 */
export function getTestAthleteById(id: string): TestAthlete | undefined {
  const athletes = getTestAthletes()
  return athletes.find(athlete => athlete.id === id)
}

/**
 * Get test athletes for a specific event
 */
export function getTestAthletesByEvent(eventId: string): TestAthlete[] {
  const athletes = getTestAthletes()
  return athletes.filter(athlete => athlete.eventId === eventId)
}

/**
 * Get test attempts for a specific athlete
 */
export function getTestAttemptsByAthlete(athleteId: string): TestAttempt[] {
  const attempts = getTestAttempts()
  return attempts.filter(attempt => attempt.athleteId === athleteId)
}

/**
 * Get test attempts for a specific event
 */
export function getTestAttemptsByEvent(eventId: string): TestAttempt[] {
  const attempts = getTestAttempts()
  return attempts.filter(attempt => attempt.eventId === eventId)
}

/**
 * Create a new test event
 */
export async function createTestEvent(page: Page, eventData: Partial<TestEvent>) {
  // Navigate to create event page
  await page.goto('/events/create')
  
  // Wait for form to be visible
  await expect(page.locator('[data-testid="event-form"]')).toBeVisible()
  
  // Fill event form
  if (eventData.name) {
    await page.fill('[data-testid="event-name-input"]', eventData.name)
  }
  
  if (eventData.sport) {
    await page.selectOption('[data-testid="sport-select"]', eventData.sport)
  }
  
  if (eventData.date) {
    await page.fill('[data-testid="event-date-input"]', eventData.date)
  }
  
  if (eventData.location) {
    await page.fill('[data-testid="event-location-input"]', eventData.location)
  }
  
  // Submit form
  await page.click('[data-testid="create-event-button"]')
  
  // Wait for success message or redirect
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
}

/**
 * Add athlete to event
 */
export async function addAthleteToEvent(page: Page, eventId: string, athleteData: Partial<TestAthlete>) {
  // Navigate to event athletes page
  await page.goto(`/events/${eventId}/athletes`)
  
  // Click add athlete button
  await page.click('[data-testid="add-athlete-button"]')
  
  // Wait for athlete form
  await expect(page.locator('[data-testid="athlete-form"]')).toBeVisible()
  
  // Fill athlete form
  if (athleteData.name) {
    await page.fill('[data-testid="athlete-name-input"]', athleteData.name)
  }
  
  if (athleteData.email) {
    await page.fill('[data-testid="athlete-email-input"]', athleteData.email)
  }
  
  if (athleteData.weightClass) {
    await page.selectOption('[data-testid="weight-class-select"]', athleteData.weightClass)
  }
  
  if (athleteData.category) {
    await page.selectOption('[data-testid="category-select"]', athleteData.category)
  }
  
  if (athleteData.team) {
    await page.fill('[data-testid="team-input"]', athleteData.team)
  }
  
  // Submit form
  await page.click('[data-testid="add-athlete-submit"]')
  
  // Wait for success
  await expect(page.locator('[data-testid="athlete-added-success"]')).toBeVisible()
}

/**
 * Start live event
 */
export async function startLiveEvent(page: Page, eventId: string) {
  // Navigate to event management page
  await page.goto(`/events/${eventId}/manage`)
  
  // Click start event button
  await page.click('[data-testid="start-event-button"]')
  
  // Confirm start
  await page.click('[data-testid="confirm-start-button"]')
  
  // Wait for event to be live
  await expect(page.locator('[data-testid="event-status"]')).toContainText('Live')
}

/**
 * Submit judge decision
 */
export async function submitJudgeDecision(page: Page, decision: 'valid' | 'invalid') {
  // Wait for judge interface to be ready
  await expect(page.locator('[data-testid="judge-interface"]')).toBeVisible()
  
  // Click decision button
  const buttonTestId = decision === 'valid' ? 'valid-button' : 'invalid-button'
  await page.click(`[data-testid="${buttonTestId}"]`)
  
  // Wait for decision to be submitted
  await expect(page.locator('[data-testid="decision-submitted"]')).toBeVisible()
}

/**
 * Wait for timer to reach specific time
 */
export async function waitForTimer(page: Page, targetSeconds: number) {
  await page.waitForFunction(
    (target) => {
      const timerElement = document.querySelector('[data-testid="timer-display"]')
      if (!timerElement) return false
      
      const timerText = timerElement.textContent || ''
      const [minutes, seconds] = timerText.split(':').map(Number)
      const totalSeconds = minutes * 60 + seconds
      
      return totalSeconds <= target
    },
    targetSeconds,
    { timeout: 30000 }
  )
}

/**
 * Check if element is in viewport
 */
export async function isInViewport(page: Page, selector: string): Promise<boolean> {
  return await page.evaluate((sel) => {
    const element = document.querySelector(sel)
    if (!element) return false
    
    const rect = element.getBoundingClientRect()
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    )
  }, selector)
}

/**
 * Simulate offline mode
 */
export async function goOffline(page: Page) {
  await page.context().setOffline(true)
  
  // Wait for offline indicator
  await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible()
}

/**
 * Simulate online mode
 */
export async function goOnline(page: Page) {
  await page.context().setOffline(false)
  
  // Wait for online indicator or offline indicator to disappear
  await expect(page.locator('[data-testid="offline-indicator"]')).not.toBeVisible()
}

/**
 * Take screenshot with timestamp
 */
export async function takeTimestampedScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `${name}-${timestamp}.png`
  await page.screenshot({ path: `test-results/${filename}`, fullPage: true })
  return filename
}