import { test, expect } from '@playwright/test'
import { loginAsRole } from './utils/auth'
import { submitJudgeDecision, goOffline, goOnline, waitForTimer } from './utils/test-data'

/**
 * Judges UI E2E tests
 * Tests offline-first functionality, judge decisions, and real-time synchronization
 */

test.describe('Judges UI', () => {
  test.beforeEach(async ({ page }) => {
    // Login as judge
    await loginAsRole(page, 'judge')
    
    // Navigate to judge interface
    await page.goto('/judge')
    await expect(page.locator('[data-testid="judge-interface"]')).toBeVisible()
  })

  test('should display judge interface correctly', async ({ page }) => {
    // Check main interface elements
    await expect(page.locator('[data-testid="current-attempt"]')).toBeVisible()
    await expect(page.locator('[data-testid="athlete-info"]')).toBeVisible()
    await expect(page.locator('[data-testid="timer-display"]')).toBeVisible()
    await expect(page.locator('[data-testid="judge-buttons"]')).toBeVisible()
    
    // Check judge decision buttons
    await expect(page.locator('[data-testid="valid-button"]')).toBeVisible()
    await expect(page.locator('[data-testid="invalid-button"]')).toBeVisible()
    
    // Check status indicators
    await expect(page.locator('[data-testid="connection-status"]')).toBeVisible()
    await expect(page.locator('[data-testid="sync-status"]')).toBeVisible()
  })

  test('should display current attempt information', async ({ page }) => {
    // Wait for attempt data to load
    await expect(page.locator('[data-testid="athlete-name"]')).toBeVisible()
    
    // Check athlete information
    const athleteName = await page.textContent('[data-testid="athlete-name"]')
    expect(athleteName).toBeTruthy()
    
    const weightClass = await page.textContent('[data-testid="weight-class"]')
    expect(weightClass).toMatch(/\d+kg/)
    
    // Check attempt details
    const discipline = await page.textContent('[data-testid="discipline"]')
    expect(discipline).toMatch(/squat|bench|deadlift|snatch|clean/i)
    
    const attemptNumber = await page.textContent('[data-testid="attempt-number"]')
    expect(attemptNumber).toMatch(/[1-3]/)
    
    const weight = await page.textContent('[data-testid="attempt-weight"]')
    expect(weight).toMatch(/\d+(\.\d+)?\s*kg/)
  })

  test('should submit valid decision successfully', async ({ page }) => {
    // Wait for attempt to be ready
    await expect(page.locator('[data-testid="valid-button"]')).toBeEnabled()
    
    // Submit valid decision
    await submitJudgeDecision(page, 'valid')
    
    // Check decision was recorded
    await expect(page.locator('[data-testid="decision-submitted"]')).toBeVisible()
    await expect(page.locator('[data-testid="decision-status"]')).toContainText('Valid')
    
    // Check buttons are disabled after decision
    await expect(page.locator('[data-testid="valid-button"]')).toBeDisabled()
    await expect(page.locator('[data-testid="invalid-button"]')).toBeDisabled()
  })

  test('should submit invalid decision successfully', async ({ page }) => {
    // Wait for attempt to be ready
    await expect(page.locator('[data-testid="invalid-button"]')).toBeEnabled()
    
    // Submit invalid decision
    await submitJudgeDecision(page, 'invalid')
    
    // Check decision was recorded
    await expect(page.locator('[data-testid="decision-submitted"]')).toBeVisible()
    await expect(page.locator('[data-testid="decision-status"]')).toContainText('Invalid')
    
    // Check buttons are disabled after decision
    await expect(page.locator('[data-testid="valid-button"]')).toBeDisabled()
    await expect(page.locator('[data-testid="invalid-button"]')).toBeDisabled()
  })

  test('should handle timer countdown', async ({ page }) => {
    // Check timer is visible and counting
    await expect(page.locator('[data-testid="timer-display"]')).toBeVisible()
    
    const initialTime = await page.textContent('[data-testid="timer-display"]')
    expect(initialTime).toMatch(/\d{1,2}:\d{2}/)
    
    // Wait a few seconds and check timer has changed
    await page.waitForTimeout(3000)
    
    const updatedTime = await page.textContent('[data-testid="timer-display"]')
    expect(updatedTime).not.toBe(initialTime)
  })

  test('should show timer warnings', async ({ page }) => {
    // Wait for timer to reach warning threshold (30 seconds)
    await waitForTimer(page, 30)
    
    // Check warning indicator appears
    await expect(page.locator('[data-testid="timer-warning"]')).toBeVisible()
    await expect(page.locator('[data-testid="timer-display"]')).toHaveClass(/warning|yellow/)
    
    // Wait for critical threshold (10 seconds)
    await waitForTimer(page, 10)
    
    // Check critical indicator appears
    await expect(page.locator('[data-testid="timer-critical"]')).toBeVisible()
    await expect(page.locator('[data-testid="timer-display"]')).toHaveClass(/critical|red/)
  })

  test.describe('Offline Functionality', () => {
    test('should work offline', async ({ page }) => {
      // Go offline
      await goOffline(page)
      
      // Check offline indicator
      await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible()
      await expect(page.locator('[data-testid="connection-status"]')).toContainText('Offline')
      
      // Should still be able to submit decisions
      await expect(page.locator('[data-testid="valid-button"]')).toBeEnabled()
      await expect(page.locator('[data-testid="invalid-button"]')).toBeEnabled()
      
      // Submit decision offline
      await submitJudgeDecision(page, 'valid')
      
      // Check decision was queued
      await expect(page.locator('[data-testid="decision-queued"]')).toBeVisible()
      await expect(page.locator('[data-testid="pending-sync"]')).toBeVisible()
    })

    test('should sync decisions when back online', async ({ page }) => {
      // Go offline and submit decision
      await goOffline(page)
      await submitJudgeDecision(page, 'valid')
      
      // Check decision is queued
      await expect(page.locator('[data-testid="pending-sync"]')).toBeVisible()
      
      // Go back online
      await goOnline(page)
      
      // Check sync indicator
      await expect(page.locator('[data-testid="syncing"]')).toBeVisible()
      
      // Wait for sync to complete
      await expect(page.locator('[data-testid="sync-complete"]')).toBeVisible()
      await expect(page.locator('[data-testid="pending-sync"]')).not.toBeVisible()
      
      // Check connection status is back to online
      await expect(page.locator('[data-testid="connection-status"]')).toContainText('Online')
    })

    test('should handle sync failures gracefully', async ({ page }) => {
      // Go offline and submit decision
      await goOffline(page)
      await submitJudgeDecision(page, 'valid')
      
      // Simulate network error when going back online
      await page.route('**/api/**', route => route.abort())
      await goOnline(page)
      
      // Check sync error indicator
      await expect(page.locator('[data-testid="sync-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="retry-sync"]')).toBeVisible()
      
      // Remove network error simulation
      await page.unroute('**/api/**')
      
      // Retry sync
      await page.click('[data-testid="retry-sync"]')
      
      // Check sync completes successfully
      await expect(page.locator('[data-testid="sync-complete"]')).toBeVisible()
    })

    test('should preserve decisions across page reloads when offline', async ({ page }) => {
      // Go offline and submit decision
      await goOffline(page)
      await submitJudgeDecision(page, 'valid')
      
      // Check decision is queued
      await expect(page.locator('[data-testid="pending-sync"]')).toBeVisible()
      
      // Reload page
      await page.reload()
      
      // Check decision is still queued after reload
      await expect(page.locator('[data-testid="pending-sync"]')).toBeVisible()
      await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible()
    })
  })

  test.describe('Real-time Updates', () => {
    test('should receive real-time attempt updates', async ({ page }) => {
      // Monitor for attempt changes
      const initialAthlete = await page.textContent('[data-testid="athlete-name"]')
      
      // Simulate new attempt (this would normally come from the system)
      await page.evaluate(() => {
        // Trigger a mock real-time update
        window.dispatchEvent(new CustomEvent('newAttempt', {
          detail: {
            athleteId: 'test-athlete-2',
            athleteName: 'Jane Strongwoman',
            discipline: 'bench',
            attemptNumber: 1,
            weight: 80
          }
        }))
      })
      
      // Check attempt was updated
      await expect(page.locator('[data-testid="athlete-name"]')).not.toContainText(initialAthlete || '')
      await expect(page.locator('[data-testid="discipline"]')).toContainText('bench')
    })

    test('should handle multiple judges decisions', async ({ page, context }) => {
      // Open second judge interface
      const secondPage = await context.newPage()
      await loginAsRole(secondPage, 'judge')
      await secondPage.goto('/judge')
      
      // Submit decision from first judge
      await submitJudgeDecision(page, 'valid')
      
      // Check second judge sees the decision
      await expect(secondPage.locator('[data-testid="other-judge-decision"]')).toBeVisible()
      await expect(secondPage.locator('[data-testid="judge-1-decision"]')).toContainText('Valid')
      
      // Submit decision from second judge
      await submitJudgeDecision(secondPage, 'invalid')
      
      // Check first judge sees the second decision
      await expect(page.locator('[data-testid="judge-2-decision"]')).toContainText('Invalid')
      
      await secondPage.close()
    })
  })

  test.describe('Accessibility', () => {
    test('should be keyboard accessible', async ({ page }) => {
      // Test keyboard navigation
      await page.keyboard.press('Tab')
      await expect(page.locator('[data-testid="valid-button"]')).toBeFocused()
      
      await page.keyboard.press('Tab')
      await expect(page.locator('[data-testid="invalid-button"]')).toBeFocused()
      
      // Test keyboard shortcuts
      await page.keyboard.press('v') // Valid decision shortcut
      await expect(page.locator('[data-testid="decision-status"]')).toContainText('Valid')
    })

    test('should have proper ARIA labels', async ({ page }) => {
      // Check ARIA labels are present
      await expect(page.locator('[data-testid="valid-button"]')).toHaveAttribute('aria-label')
      await expect(page.locator('[data-testid="invalid-button"]')).toHaveAttribute('aria-label')
      await expect(page.locator('[data-testid="timer-display"]')).toHaveAttribute('aria-label')
      
      // Check live regions for screen readers
      await expect(page.locator('[data-testid="decision-status"]')).toHaveAttribute('aria-live')
      await expect(page.locator('[data-testid="timer-display"]')).toHaveAttribute('aria-live')
    })
  })

  test.describe('Performance', () => {
    test('should load quickly', async ({ page }) => {
      const startTime = Date.now()
      
      await page.goto('/judge')
      await expect(page.locator('[data-testid="judge-interface"]')).toBeVisible()
      
      const loadTime = Date.now() - startTime
      expect(loadTime).toBeLessThan(3000) // Should load within 3 seconds
    })

    test('should handle rapid decision submissions', async ({ page }) => {
      // Simulate rapid clicking (stress test)
      for (let i = 0; i < 5; i++) {
        await page.click('[data-testid="valid-button"]')
        await page.waitForTimeout(100)
      }
      
      // Should only register one decision
      const decisions = await page.locator('[data-testid="decision-submitted"]').count()
      expect(decisions).toBe(1)
    })
  })
})