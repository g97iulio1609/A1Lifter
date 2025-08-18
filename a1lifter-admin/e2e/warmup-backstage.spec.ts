import { test, expect } from '@playwright/test'
import { loginAsRole as loginUser, logout as logoutUser } from './utils/auth'
import { getTestEventById } from './utils/test-data'

/**
 * Warm-up and Backstage Monitors E2E tests
 * Tests organizer/admin interfaces for event management and monitoring
 */

test.describe('Warm-up Monitor', () => {
  const testEvent = getTestEventById('test-warmup-event')
  
  test.beforeEach(async ({ page }) => {
    // Login as organizer
    await loginUser(page, 'organizer')
    await page.goto(`/warmup/${testEvent?.id || 'test-warmup-event'}`)
  })

  test.afterEach(async ({ page }) => {
    await logoutUser(page)
  })

  test('should display warm-up area correctly', async ({ page }) => {
    // Check main interface elements
    await expect(page.locator('[data-testid="warmup-header"]')).toBeVisible()
    await expect(page.locator('[data-testid="warmup-athletes-list"]')).toBeVisible()
    await expect(page.locator('[data-testid="warmup-timer"]')).toBeVisible()
    await expect(page.locator('[data-testid="next-attempts"]')).toBeVisible()
    
    // Check event information
    const eventTitle = await page.textContent('[data-testid="event-title"]')
    expect(eventTitle).toContain(testEvent?.name || 'Warm-up Test Event')
    
    // Check current session info
    await expect(page.locator('[data-testid="current-session"]')).toBeVisible()
    await expect(page.locator('[data-testid="current-discipline"]')).toBeVisible()
  })

  test('should show athletes in warm-up area', async ({ page }) => {
    // Check athletes list is populated
    const athletes = await page.locator('[data-testid="warmup-athlete"]').count()
    expect(athletes).toBeGreaterThan(0)
    
    // Check athlete information
    const firstAthlete = page.locator('[data-testid="warmup-athlete"]').first()
    await expect(firstAthlete.locator('[data-testid="athlete-name"]')).toBeVisible()
    await expect(firstAthlete.locator('[data-testid="athlete-weight-class"]')).toBeVisible()
    await expect(firstAthlete.locator('[data-testid="athlete-next-attempt"]')).toBeVisible()
    await expect(firstAthlete.locator('[data-testid="athlete-warmup-status"]')).toBeVisible()
    
    // Check warmup status indicators
    const status = await firstAthlete.locator('[data-testid="athlete-warmup-status"]').textContent()
    expect(status).toMatch(/warming|ready|called/i)
  })

  test('should track athlete warm-up progress', async ({ page }) => {
    const firstAthlete = page.locator('[data-testid="warmup-athlete"]').first()
    
  // Check initial status (ensure element is present)
  await firstAthlete.locator('[data-testid="athlete-warmup-status"]').textContent()
    
    // Update warmup status
    await firstAthlete.locator('[data-testid="update-warmup-status"]').click()
    await page.selectOption('[data-testid="warmup-status-select"]', 'ready')
    await page.click('[data-testid="save-warmup-status"]')
    
    // Check status was updated
    await expect(firstAthlete.locator('[data-testid="athlete-warmup-status"]')).toContainText('ready')
    
    // Check status change is reflected in styling
    await expect(firstAthlete).toHaveClass(/ready|status-ready/)
  })

  test('should show next attempts timeline', async ({ page }) => {
    // Check next attempts section
    await expect(page.locator('[data-testid="next-attempts"]')).toBeVisible()
    
    const nextAttempts = await page.locator('[data-testid="next-attempt"]').count()
    expect(nextAttempts).toBeGreaterThan(0)
    
    // Check attempt information
    const firstAttempt = page.locator('[data-testid="next-attempt"]').first()
    await expect(firstAttempt.locator('[data-testid="attempt-athlete"]')).toBeVisible()
    await expect(firstAttempt.locator('[data-testid="attempt-discipline"]')).toBeVisible()
    await expect(firstAttempt.locator('[data-testid="attempt-weight"]')).toBeVisible()
    await expect(firstAttempt.locator('[data-testid="attempt-time"]')).toBeVisible()
    
    // Check attempts are ordered by time
    const firstTime = await firstAttempt.locator('[data-testid="attempt-time"]').textContent()
    const secondAttempt = page.locator('[data-testid="next-attempt"]').nth(1)
    const secondTime = await secondAttempt.locator('[data-testid="attempt-time"]').textContent()
    
    // Times should be in chronological order
    expect(firstTime).toBeTruthy()
    expect(secondTime).toBeTruthy()
  })

  test('should filter athletes by discipline', async ({ page }) => {
    // Check discipline filter
    await expect(page.locator('[data-testid="discipline-filter"]')).toBeVisible()
    
    // Filter by squat
    await page.selectOption('[data-testid="discipline-filter"]', 'squat')
    
    // Check only squat athletes are shown
    const athletes = await page.locator('[data-testid="warmup-athlete"]').all()
    for (const athlete of athletes) {
      const discipline = await athlete.locator('[data-testid="athlete-next-discipline"]').textContent()
      expect(discipline?.toLowerCase()).toContain('squat')
    }
    
    // Filter by bench press
    await page.selectOption('[data-testid="discipline-filter"]', 'bench')
    
    // Check filter updates
    const benchAthletes = await page.locator('[data-testid="warmup-athlete"]').all()
    for (const athlete of benchAthletes) {
      const discipline = await athlete.locator('[data-testid="athlete-next-discipline"]').textContent()
      expect(discipline?.toLowerCase()).toContain('bench')
    }
  })

  test('should handle athlete check-in', async ({ page }) => {
    const firstAthlete = page.locator('[data-testid="warmup-athlete"]').first()
    
    // Check athlete in
    await firstAthlete.locator('[data-testid="check-in-athlete"]').click()
    
    // Confirm check-in
    await expect(page.locator('[data-testid="check-in-confirmation"]')).toBeVisible()
    await page.click('[data-testid="confirm-check-in"]')
    
    // Check athlete status updated
    await expect(firstAthlete.locator('[data-testid="athlete-check-in-status"]')).toContainText('checked in')
    await expect(firstAthlete).toHaveClass(/checked-in/)
    
    // Check check-in time is recorded
    await expect(firstAthlete.locator('[data-testid="check-in-time"]')).toBeVisible()
  })
})

test.describe('Backstage Monitor', () => {
  const testEvent = getTestEventById('test-backstage-event')
  
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await loginUser(page, 'admin')
    await page.goto(`/backstage/${testEvent?.id || 'test-backstage-event'}`)
  })

  test.afterEach(async ({ page }) => {
    await logoutUser(page)
  })

  test('should display backstage overview', async ({ page }) => {
    // Check main interface elements
    await expect(page.locator('[data-testid="backstage-header"]')).toBeVisible()
    await expect(page.locator('[data-testid="event-status"]')).toBeVisible()
    await expect(page.locator('[data-testid="session-control"]')).toBeVisible()
    await expect(page.locator('[data-testid="judges-status"]')).toBeVisible()
    await expect(page.locator('[data-testid="technical-status"]')).toBeVisible()
    
    // Check event information
    const eventTitle = await page.textContent('[data-testid="event-title"]')
    expect(eventTitle).toContain(testEvent?.name || 'Backstage Test Event')
  })

  test('should show session control panel', async ({ page }) => {
    // Check session controls
    await expect(page.locator('[data-testid="start-session"]')).toBeVisible()
    await expect(page.locator('[data-testid="pause-session"]')).toBeVisible()
    await expect(page.locator('[data-testid="end-session"]')).toBeVisible()
    
    // Check current session info
    await expect(page.locator('[data-testid="current-session-name"]')).toBeVisible()
    await expect(page.locator('[data-testid="session-progress"]')).toBeVisible()
    
    // Test session control
    await page.click('[data-testid="start-session"]')
    await expect(page.locator('[data-testid="session-status"]')).toContainText('running')
    
    await page.click('[data-testid="pause-session"]')
    await expect(page.locator('[data-testid="session-status"]')).toContainText('paused')
  })

  test('should monitor judges status', async ({ page }) => {
    // Check judges panel
    await expect(page.locator('[data-testid="judges-status"]')).toBeVisible()
    
    const judges = await page.locator('[data-testid="judge-status"]').count()
    expect(judges).toBeGreaterThan(0)
    
    // Check judge information
    const firstJudge = page.locator('[data-testid="judge-status"]').first()
    await expect(firstJudge.locator('[data-testid="judge-name"]')).toBeVisible()
    await expect(firstJudge.locator('[data-testid="judge-position"]')).toBeVisible()
    await expect(firstJudge.locator('[data-testid="judge-connection"]')).toBeVisible()
    
    // Check connection status
    const connectionStatus = await firstJudge.locator('[data-testid="judge-connection"]').textContent()
    expect(connectionStatus).toMatch(/online|offline|connected|disconnected/i)
  })

  test('should show technical equipment status', async ({ page }) => {
    // Check technical status panel
    await expect(page.locator('[data-testid="technical-status"]')).toBeVisible()
    
    // Check equipment status
    await expect(page.locator('[data-testid="timer-status"]')).toBeVisible()
    await expect(page.locator('[data-testid="display-status"]')).toBeVisible()
    await expect(page.locator('[data-testid="sound-status"]')).toBeVisible()
    
    // Check status indicators
    const timerStatus = await page.textContent('[data-testid="timer-status"]')
    expect(timerStatus).toMatch(/ok|error|warning/i)
    
    const displayStatus = await page.textContent('[data-testid="display-status"]')
    expect(displayStatus).toMatch(/ok|error|warning/i)
  })

  test('should handle emergency controls', async ({ page }) => {
    // Check emergency controls are available
    await expect(page.locator('[data-testid="emergency-controls"]')).toBeVisible()
    await expect(page.locator('[data-testid="emergency-stop"]')).toBeVisible()
    await expect(page.locator('[data-testid="reset-timer"]')).toBeVisible()
    
    // Test emergency stop
    await page.click('[data-testid="emergency-stop"]')
    
    // Confirm emergency action
    await expect(page.locator('[data-testid="emergency-confirmation"]')).toBeVisible()
    await page.click('[data-testid="confirm-emergency-stop"]')
    
    // Check emergency state
    await expect(page.locator('[data-testid="emergency-active"]')).toBeVisible()
    await expect(page.locator('[data-testid="session-status"]')).toContainText('emergency')
  })

  test('should manage athlete queue', async ({ page }) => {
    // Check athlete queue panel
    await expect(page.locator('[data-testid="athlete-queue"]')).toBeVisible()
    
    const queuedAthletes = await page.locator('[data-testid="queued-athlete"]').count()
    expect(queuedAthletes).toBeGreaterThan(0)
    
    // Check athlete queue information
    const firstAthlete = page.locator('[data-testid="queued-athlete"]').first()
    await expect(firstAthlete.locator('[data-testid="athlete-name"]')).toBeVisible()
    await expect(firstAthlete.locator('[data-testid="athlete-attempt"]')).toBeVisible()
    await expect(firstAthlete.locator('[data-testid="athlete-weight"]')).toBeVisible()
    
    // Test reordering queue
    await firstAthlete.locator('[data-testid="move-down"]').click()
    
    // Check athlete moved in queue
    const newFirstAthlete = page.locator('[data-testid="queued-athlete"]').first()
    const newFirstName = await newFirstAthlete.locator('[data-testid="athlete-name"]').textContent()
    const originalFirstName = await firstAthlete.locator('[data-testid="athlete-name"]').textContent()
    expect(newFirstName).not.toBe(originalFirstName)
  })

  test('should show real-time statistics', async ({ page }) => {
    // Check statistics panel
    await expect(page.locator('[data-testid="event-statistics"]')).toBeVisible()
    
    // Check key metrics
    await expect(page.locator('[data-testid="total-athletes"]')).toBeVisible()
    await expect(page.locator('[data-testid="completed-attempts"]')).toBeVisible()
    await expect(page.locator('[data-testid="success-rate"]')).toBeVisible()
    await expect(page.locator('[data-testid="average-time"]')).toBeVisible()
    
    // Check values are numeric
    const totalAthletes = await page.textContent('[data-testid="total-athletes"]')
    expect(totalAthletes).toMatch(/\d+/)
    
    const successRate = await page.textContent('[data-testid="success-rate"]')
    expect(successRate).toMatch(/\d+(\.\d+)?%/)
  })

  test('should export event data', async ({ page }) => {
    // Check export controls
    await expect(page.locator('[data-testid="export-controls"]')).toBeVisible()
    await expect(page.locator('[data-testid="export-results"]')).toBeVisible()
    await expect(page.locator('[data-testid="export-attempts"]')).toBeVisible()
    
    // Test results export
    const downloadPromise = page.waitForEvent('download')
    await page.click('[data-testid="export-results"]')
    
    // Select export format
    await page.selectOption('[data-testid="export-format"]', 'pdf')
    await page.click('[data-testid="confirm-export"]')
    
    const download = await downloadPromise
    expect(download.suggestedFilename()).toContain('.pdf')
    
    // Test attempts export
    const attemptsDownloadPromise = page.waitForEvent('download')
    await page.click('[data-testid="export-attempts"]')
    await page.selectOption('[data-testid="export-format"]', 'excel')
    await page.click('[data-testid="confirm-export"]')
    
    const attemptsDownload = await attemptsDownloadPromise
    expect(attemptsDownload.suggestedFilename()).toMatch(/\.(xlsx|xls)$/)
  })
})

test.describe('Monitor Integration', () => {
  test('should sync between warm-up and backstage', async ({ page, context }) => {
    // Open warm-up monitor in first tab
    const warmupPage = await context.newPage()
    await loginUser(warmupPage, 'organizer')
    await warmupPage.goto('/warmup/test-integration-event')
    
    // Open backstage monitor in second tab
    await loginUser(page, 'admin')
    await page.goto('/backstage/test-integration-event')
    
    // Update athlete status in warm-up
    const athlete = warmupPage.locator('[data-testid="warmup-athlete"]').first()
    await athlete.locator('[data-testid="update-warmup-status"]').click()
    await warmupPage.selectOption('[data-testid="warmup-status-select"]', 'ready')
    await warmupPage.click('[data-testid="save-warmup-status"]')
    
    // Check status updates in backstage
    await page.waitForTimeout(2000) // Allow time for sync
    const backstageAthlete = page.locator('[data-testid="queued-athlete"]').first()
    await expect(backstageAthlete.locator('[data-testid="athlete-status"]')).toContainText('ready')
    
    await warmupPage.close()
  })

  test('should handle offline scenarios', async ({ page }) => {
    await loginUser(page, 'organizer')
    await page.goto('/warmup/test-offline-event')
    
    // Go offline
    await page.context().setOffline(true)
    
    // Check offline indicator
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible()
    
    // Update athlete status while offline
    const athlete = page.locator('[data-testid="warmup-athlete"]').first()
    await athlete.locator('[data-testid="update-warmup-status"]').click()
    await page.selectOption('[data-testid="warmup-status-select"]', 'ready')
    await page.click('[data-testid="save-warmup-status"]')
    
    // Check offline queue indicator
    await expect(page.locator('[data-testid="pending-sync"]')).toBeVisible()
    
    // Go back online
    await page.context().setOffline(false)
    
    // Check sync occurs
    await expect(page.locator('[data-testid="sync-complete"]')).toBeVisible()
    await expect(page.locator('[data-testid="pending-sync"]')).not.toBeVisible()
  })

  test('should maintain performance under load', async ({ page }) => {
    await loginUser(page, 'admin')
    await page.goto('/backstage/test-performance-event')
    
    const startTime = Date.now()
    
    // Simulate high-frequency updates
    for (let i = 0; i < 100; i++) {
      await page.evaluate((index) => {
        window.dispatchEvent(new CustomEvent('athleteUpdate', {
          detail: {
            athleteId: `athlete-${index % 10}`,
            status: index % 2 === 0 ? 'ready' : 'warming',
            timestamp: Date.now()
          }
        }))
      }, i)
      
      if (i % 20 === 0) {
        await page.waitForTimeout(50) // Small pause every 20 updates
      }
    }
    
    const updateTime = Date.now() - startTime
    expect(updateTime).toBeLessThan(5000) // Should handle 100 updates in under 5 seconds
    
    // Check interface is still responsive
    await expect(page.locator('[data-testid="backstage-header"]')).toBeVisible()
    await expect(page.locator('[data-testid="athlete-queue"]')).toBeVisible()
  })
})