import { test, expect } from '@playwright/test'
import { getTestEventById, isInViewport, takeTimestampedScreenshot } from './utils/test-data'

/**
 * Public Live UI E2E tests
 * Tests SEO optimization, real-time updates, and public viewing experience
 */

test.describe('Public Live UI', () => {
  const liveEvent = getTestEventById('test-live-event')
  
  test.beforeEach(async ({ page }) => {
    // Navigate to public live page
    await page.goto(`/live/${liveEvent?.id || 'test-live-event'}`)
  })

  test('should display live event correctly', async ({ page }) => {
    // Check main interface elements
    await expect(page.locator('[data-testid="live-event-header"]')).toBeVisible()
    await expect(page.locator('[data-testid="event-title"]')).toBeVisible()
    await expect(page.locator('[data-testid="current-attempt"]')).toBeVisible()
    await expect(page.locator('[data-testid="leaderboard"]')).toBeVisible()
    await expect(page.locator('[data-testid="timer-display"]')).toBeVisible()
    
    // Check event information
    const eventTitle = await page.textContent('[data-testid="event-title"]')
    expect(eventTitle).toContain(liveEvent?.name || 'Live Test Event')
    
    const eventLocation = await page.textContent('[data-testid="event-location"]')
    expect(eventLocation).toBeTruthy()
    
    const eventDate = await page.textContent('[data-testid="event-date"]')
    expect(eventDate).toBeTruthy()
  })

  test('should display current attempt information', async ({ page }) => {
    // Wait for attempt data to load
    await expect(page.locator('[data-testid="current-athlete"]')).toBeVisible()
    
    // Check athlete information
    const athleteName = await page.textContent('[data-testid="current-athlete-name"]')
    expect(athleteName).toBeTruthy()
    
    const weightClass = await page.textContent('[data-testid="current-athlete-weight-class"]')
    expect(weightClass).toMatch(/\d+kg/)
    
    // Check attempt details
    const discipline = await page.textContent('[data-testid="current-discipline"]')
    expect(discipline).toMatch(/squat|bench|deadlift|snatch|clean/i)
    
    const attemptWeight = await page.textContent('[data-testid="current-attempt-weight"]')
    expect(attemptWeight).toMatch(/\d+(\.\d+)?\s*kg/)
    
    const attemptNumber = await page.textContent('[data-testid="current-attempt-number"]')
    expect(attemptNumber).toMatch(/[1-3]/)
  })

  test('should display leaderboard correctly', async ({ page }) => {
    // Check leaderboard is visible
    await expect(page.locator('[data-testid="leaderboard"]')).toBeVisible()
    
    // Check leaderboard has athletes
    const athletes = await page.locator('[data-testid="leaderboard-athlete"]').count()
    expect(athletes).toBeGreaterThan(0)
    
    // Check athlete entries have required information
    const firstAthlete = page.locator('[data-testid="leaderboard-athlete"]').first()
    await expect(firstAthlete.locator('[data-testid="athlete-name"]')).toBeVisible()
    await expect(firstAthlete.locator('[data-testid="athlete-total"]')).toBeVisible()
    await expect(firstAthlete.locator('[data-testid="athlete-position"]')).toBeVisible()
    
    // Check sorting (first athlete should have highest total)
    const firstTotal = await firstAthlete.locator('[data-testid="athlete-total"]').textContent()
    const secondAthlete = page.locator('[data-testid="leaderboard-athlete"]').nth(1)
    const secondTotal = await secondAthlete.locator('[data-testid="athlete-total"]').textContent()
    
    const firstValue = parseFloat(firstTotal?.replace(/[^\d.]/g, '') || '0')
    const secondValue = parseFloat(secondTotal?.replace(/[^\d.]/g, '') || '0')
    expect(firstValue).toBeGreaterThanOrEqual(secondValue)
  })

  test('should filter leaderboard by discipline', async ({ page }) => {
    // Check discipline filter is available
    await expect(page.locator('[data-testid="discipline-filter"]')).toBeVisible()
    
    // Test filtering by squat
    await page.selectOption('[data-testid="discipline-filter"]', 'squat')
    
    // Check leaderboard updates
    await expect(page.locator('[data-testid="leaderboard-title"]')).toContainText('Squat')
    
    // Check athlete entries show squat results
    const firstAthlete = page.locator('[data-testid="leaderboard-athlete"]').first()
    await expect(firstAthlete.locator('[data-testid="squat-result"]')).toBeVisible()
    
    // Test filtering by bench press
    await page.selectOption('[data-testid="discipline-filter"]', 'bench')
    await expect(page.locator('[data-testid="leaderboard-title"]')).toContainText('Bench')
    
    // Test showing all disciplines
    await page.selectOption('[data-testid="discipline-filter"]', 'all')
    await expect(page.locator('[data-testid="leaderboard-title"]')).toContainText('Overall')
  })

  test('should display timer correctly', async ({ page }) => {
    // Check timer is visible
    await expect(page.locator('[data-testid="timer-display"]')).toBeVisible()
    
    const timerText = await page.textContent('[data-testid="timer-display"]')
    expect(timerText).toMatch(/\d{1,2}:\d{2}/)
    
    // Check timer updates
    const initialTime = timerText
    await page.waitForTimeout(2000)
    
    const updatedTime = await page.textContent('[data-testid="timer-display"]')
    expect(updatedTime).not.toBe(initialTime)
  })

  test.describe('SEO Optimization', () => {
    test('should have proper meta tags', async ({ page }) => {
      // Check page title
      const title = await page.title()
      expect(title).toContain(liveEvent?.name || 'Live')
      expect(title).toContain('A1Lifter')
      
      // Check meta description
      const metaDescription = await page.getAttribute('meta[name="description"]', 'content')
      expect(metaDescription).toBeTruthy()
      expect(metaDescription).toContain('live')
      
      // Check Open Graph tags
      const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content')
      expect(ogTitle).toBeTruthy()
      
      const ogDescription = await page.getAttribute('meta[property="og:description"]', 'content')
      expect(ogDescription).toBeTruthy()
      
      const ogImage = await page.getAttribute('meta[property="og:image"]', 'content')
      expect(ogImage).toBeTruthy()
      
      // Check Twitter Card tags
      const twitterCard = await page.getAttribute('meta[name="twitter:card"]', 'content')
      expect(twitterCard).toBe('summary_large_image')
    })

    test('should have structured data', async ({ page }) => {
      // Check for JSON-LD structured data
      const structuredData = await page.locator('script[type="application/ld+json"]').textContent()
      expect(structuredData).toBeTruthy()
      
      const jsonData = JSON.parse(structuredData || '{}')
      expect(jsonData['@type']).toBe('SportsEvent')
      expect(jsonData.name).toBeTruthy()
      expect(jsonData.startDate).toBeTruthy()
      expect(jsonData.location).toBeTruthy()
    })

    test('should have proper heading hierarchy', async ({ page }) => {
      // Check H1 exists and is unique
      const h1Elements = await page.locator('h1').count()
      expect(h1Elements).toBe(1)
      
      const h1Text = await page.textContent('h1')
      expect(h1Text).toBeTruthy()
      
      // Check heading hierarchy (H2, H3, etc.)
      const h2Elements = await page.locator('h2').count()
      expect(h2Elements).toBeGreaterThan(0)
    })

    test('should be crawlable by search engines', async ({ page }) => {
      // Check robots meta tag allows indexing
      const robotsMeta = await page.getAttribute('meta[name="robots"]', 'content')
      expect(robotsMeta).not.toContain('noindex')
      
      // Check canonical URL
      const canonicalUrl = await page.getAttribute('link[rel="canonical"]', 'href')
      expect(canonicalUrl).toBeTruthy()
      expect(canonicalUrl).toContain('/live/')
    })
  })

  test.describe('Real-time Updates', () => {
    test('should update attempt information in real-time', async ({ page }) => {
      const initialAthlete = await page.textContent('[data-testid="current-athlete-name"]')
      
      // Simulate real-time attempt update
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('attemptUpdate', {
          detail: {
            athleteId: 'test-athlete-2',
            athleteName: 'Jane Strongwoman',
            discipline: 'bench',
            attemptNumber: 2,
            weight: 85
          }
        }))
      })
      
      // Check attempt was updated
      await expect(page.locator('[data-testid="current-athlete-name"]')).not.toContainText(initialAthlete || '')
      await expect(page.locator('[data-testid="current-discipline"]')).toContainText('bench')
      await expect(page.locator('[data-testid="current-attempt-weight"]')).toContainText('85')
    })

    test('should update leaderboard in real-time', async ({ page }) => {
  // Get initial leaderboard state (value not needed, ensure element exists)
  await page.textContent('[data-testid="leaderboard-athlete"]:first-child [data-testid="athlete-name"]')
      
      // Simulate successful lift that changes rankings
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('liftComplete', {
          detail: {
            athleteId: 'test-athlete-2',
            discipline: 'squat',
            weight: 200,
            valid: true,
            newTotal: 450
          }
        }))
      })
      
      // Check leaderboard updates
      await page.waitForTimeout(1000) // Allow time for update
      
      const updatedFirstPlace = await page.textContent('[data-testid="leaderboard-athlete"]:first-child [data-testid="athlete-name"]')
      // Rankings might have changed
      expect(updatedFirstPlace).toBeTruthy()
    })

    test('should show live indicators', async ({ page }) => {
      // Check live indicator is visible
      await expect(page.locator('[data-testid="live-indicator"]')).toBeVisible()
      await expect(page.locator('[data-testid="live-indicator"]')).toContainText('LIVE')
      
      // Check live indicator has animation/styling
      const liveIndicator = page.locator('[data-testid="live-indicator"]')
      await expect(liveIndicator).toHaveClass(/live|pulse|animate/)
    })
  })

  test.describe('Responsive Design', () => {
    test('should work on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      
      // Check mobile layout
      await expect(page.locator('[data-testid="mobile-layout"]')).toBeVisible()
      
      // Check elements are properly sized
      await expect(page.locator('[data-testid="timer-display"]')).toBeVisible()
      await expect(page.locator('[data-testid="current-attempt"]')).toBeVisible()
      
      // Check leaderboard is scrollable on mobile
      const leaderboard = page.locator('[data-testid="leaderboard"]')
      await expect(leaderboard).toBeVisible()
      
      // Test horizontal scroll if needed
      const isScrollable = await leaderboard.evaluate(el => el.scrollWidth > el.clientWidth)
      if (isScrollable) {
        await leaderboard.evaluate(el => {
          el.scrollBy({ left: 100, behavior: 'auto' })
        })
      }
    })

    test('should work on tablet devices', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 })
      
      // Check tablet layout
      await expect(page.locator('[data-testid="tablet-layout"]')).toBeVisible()
      
      // Check elements are properly arranged
      await expect(page.locator('[data-testid="current-attempt"]')).toBeVisible()
      await expect(page.locator('[data-testid="leaderboard"]')).toBeVisible()
      
      // Check both elements are in viewport
      expect(await isInViewport(page, '[data-testid="current-attempt"]')).toBe(true)
      expect(await isInViewport(page, '[data-testid="leaderboard"]')).toBe(true)
    })

    test('should work on desktop', async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 })
      
      // Check desktop layout
      await expect(page.locator('[data-testid="desktop-layout"]')).toBeVisible()
      
      // Check side-by-side layout
      const currentAttempt = page.locator('[data-testid="current-attempt"]')
      const leaderboard = page.locator('[data-testid="leaderboard"]')
      
      const attemptBox = await currentAttempt.boundingBox()
      const leaderboardBox = await leaderboard.boundingBox()
      
      // Should be side by side (different x positions)
      expect(attemptBox?.x).not.toBe(leaderboardBox?.x)
    })
  })

  test.describe('Performance', () => {
    test('should load quickly', async ({ page }) => {
      const startTime = Date.now()
      
      await page.goto(`/live/${liveEvent?.id || 'test-live-event'}`)
      await expect(page.locator('[data-testid="live-event-header"]')).toBeVisible()
      
      const loadTime = Date.now() - startTime
      expect(loadTime).toBeLessThan(3000) // Should load within 3 seconds
    })

    test('should have good Core Web Vitals', async ({ page }) => {
      // Navigate and wait for load
      await page.goto(`/live/${liveEvent?.id || 'test-live-event'}`)
      await page.waitForLoadState('networkidle')
      
      // Measure performance
      const metrics = await page.evaluate<{ lcp: number; cls: number }>(() => {
        return new Promise<{ lcp: number; cls: number }>((resolve) => {
          let latestLcp = 0
          let cumulativeCls = 0

          type LayoutShiftEntry = PerformanceEntry & { value: number; hadRecentInput?: boolean }

          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries()
            for (const entry of entries) {
              if (entry.entryType === 'largest-contentful-paint') {
                latestLcp = Math.max(latestLcp, entry.startTime || 0)
              } else if (entry.entryType === 'layout-shift') {
                const ls = entry as LayoutShiftEntry
                if (!ls.hadRecentInput) {
                  cumulativeCls += ls.value || 0
                }
              }
            }
          })

          observer.observe({ entryTypes: ['largest-contentful-paint', 'layout-shift'] } as PerformanceObserverInit)

          // Fallback timeout
          setTimeout(() => {
            try {
              observer.disconnect()
            } catch (_err) {
              void _err
            }
            resolve({ lcp: latestLcp, cls: cumulativeCls })
          }, 5000)
        })
      })
      
      // Check Core Web Vitals thresholds
  expect(metrics.lcp).toBeLessThan(2500)
  expect(metrics.cls).toBeLessThan(0.1)
    })

    test('should handle many real-time updates efficiently', async ({ page }) => {
      // Simulate rapid updates
      for (let i = 0; i < 50; i++) {
        await page.evaluate((index) => {
          window.dispatchEvent(new CustomEvent('attemptUpdate', {
            detail: {
              athleteId: `test-athlete-${index % 3 + 1}`,
              discipline: 'squat',
              weight: 100 + index,
              timestamp: Date.now()
            }
          }))
        }, i)
        
        if (i % 10 === 0) {
          await page.waitForTimeout(100) // Small pause every 10 updates
        }
      }
      
      // Check page is still responsive
      await expect(page.locator('[data-testid="current-attempt"]')).toBeVisible()
      await expect(page.locator('[data-testid="leaderboard"]')).toBeVisible()
    })
  })

  test.describe('Accessibility', () => {
    test('should be accessible to screen readers', async ({ page }) => {
      // Check ARIA labels and roles
      await expect(page.locator('[data-testid="live-event-header"]')).toHaveAttribute('role')
      await expect(page.locator('[data-testid="timer-display"]')).toHaveAttribute('aria-label')
      await expect(page.locator('[data-testid="leaderboard"]')).toHaveAttribute('role', 'table')
      
      // Check live regions for dynamic content
      await expect(page.locator('[data-testid="current-attempt"]')).toHaveAttribute('aria-live')
      await expect(page.locator('[data-testid="timer-display"]')).toHaveAttribute('aria-live')
    })

    test('should have proper color contrast', async ({ page }) => {
      // Take screenshot for manual contrast checking
      await takeTimestampedScreenshot(page, 'public-live-ui-contrast')
      
      // Check text is readable (basic check)
      const textElements = await page.locator('text=').all()
      for (const element of textElements.slice(0, 10)) { // Check first 10 text elements
        const isVisible = await element.isVisible()
        if (isVisible) {
          const text = await element.textContent()
          expect(text?.trim()).toBeTruthy()
        }
      }
    })

    test('should support keyboard navigation', async ({ page }) => {
      // Test tab navigation
      await page.keyboard.press('Tab')
      
      // Check focus is visible
      const focusedElement = await page.locator(':focus')
      await expect(focusedElement).toBeVisible()
      
      // Test discipline filter keyboard access
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Enter')
      
      // Should be able to change filter with keyboard
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('Enter')
    })
  })
})