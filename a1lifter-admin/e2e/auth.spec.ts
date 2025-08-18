import { test, expect } from '@playwright/test'
import { login, logout, loginAsRole, isLoggedIn, getCurrentUser, getTestUserByRole } from './utils/auth'

/**
 * Authentication E2E tests
 * Tests login, logout, and role-based access control
 */

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we start with a clean state
    await page.goto('/')
  })

  test('should display login page when not authenticated', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible()
    await expect(page.locator('h1')).toContainText('Login')
  })

  test('should login successfully with valid credentials', async ({ page }) => {
    const user = getTestUserByRole('admin')
    
    await login(page, user.email, user.password)
    
    // Should be redirected to dashboard
    await expect(page).toHaveURL(/\/(dashboard|home|events)/)
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
    
    // Verify user info is displayed
    const currentUser = await getCurrentUser(page)
    expect(currentUser?.email).toBe(user.email)
    expect(currentUser?.role).toBe(user.role)
  })

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login')
    
    await page.fill('[data-testid="email-input"]', 'invalid@test.com')
    await page.fill('[data-testid="password-input"]', 'wrongpassword')
    await page.click('[data-testid="login-button"]')
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-message"]')).toContainText(/invalid|incorrect|wrong/i)
    
    // Should remain on login page
    await expect(page).toHaveURL(/\/login/)
  })

  test('should logout successfully', async ({ page }) => {
    const user = getTestUserByRole('admin')
    
    // Login first
    await login(page, user.email, user.password)
    await expect(await isLoggedIn(page)).toBe(true)
    
    // Logout
    await logout(page)
    
    // Should be logged out
    await expect(await isLoggedIn(page)).toBe(false)
    await expect(page).toHaveURL(/\/(login|home|\/?)$/)
  })

  test('should maintain session across page reloads', async ({ page }) => {
    const user = getTestUserByRole('admin')
    
    await login(page, user.email, user.password)
    
    // Reload page
    await page.reload()
    
    // Should still be logged in
    await expect(await isLoggedIn(page)).toBe(true)
    const currentUser = await getCurrentUser(page)
    expect(currentUser?.email).toBe(user.email)
  })

  test.describe('Role-based Access Control', () => {
    test('admin should access admin features', async ({ page }) => {
      await loginAsRole(page, 'admin')
      
      // Should see admin menu
      await expect(page.locator('[data-testid="admin-menu"]')).toBeVisible()
      
      // Should be able to access admin pages
      await page.goto('/admin/users')
      await expect(page.locator('[data-testid="admin-users-page"]')).toBeVisible()
      
      await page.goto('/admin/settings')
      await expect(page.locator('[data-testid="admin-settings-page"]')).toBeVisible()
    })

    test('organizer should access organizer features', async ({ page }) => {
      await loginAsRole(page, 'organizer')
      
      // Should see organizer menu
      await expect(page.locator('[data-testid="organizer-menu"]')).toBeVisible()
      
      // Should be able to create events
      await page.goto('/events/create')
      await expect(page.locator('[data-testid="event-form"]')).toBeVisible()
      
      // Should be able to manage events
      await page.goto('/events/manage')
      await expect(page.locator('[data-testid="events-management"]')).toBeVisible()
    })

    test('judge should access judge features', async ({ page }) => {
      await loginAsRole(page, 'judge')
      
      // Should see judge menu
      await expect(page.locator('[data-testid="judge-menu"]')).toBeVisible()
      
      // Should be able to access judge interface
      await page.goto('/judge')
      await expect(page.locator('[data-testid="judge-interface"]')).toBeVisible()
    })

    test('athlete should access athlete features', async ({ page }) => {
      await loginAsRole(page, 'athlete')
      
      // Should see athlete menu
      await expect(page.locator('[data-testid="athlete-menu"]')).toBeVisible()
      
      // Should be able to view profile
      await page.goto('/profile')
      await expect(page.locator('[data-testid="athlete-profile"]')).toBeVisible()
      
      // Should be able to view registrations
      await page.goto('/registrations')
      await expect(page.locator('[data-testid="athlete-registrations"]')).toBeVisible()
    })

    test('should restrict access to unauthorized pages', async ({ page }) => {
      await loginAsRole(page, 'athlete')
      
      // Athlete should not access admin pages
      await page.goto('/admin/users')
      await expect(page.locator('[data-testid="access-denied"]')).toBeVisible()
      
      // Athlete should not access organizer pages
      await page.goto('/events/create')
      await expect(page.locator('[data-testid="access-denied"]')).toBeVisible()
    })
  })

  test.describe('Session Management', () => {
    test('should handle session expiration', async ({ page }) => {
      const user = getTestUserByRole('admin')
      await login(page, user.email, user.password)
      
      // Simulate session expiration by clearing auth tokens
      await page.evaluate(() => {
        localStorage.removeItem('a1lifter-auth')
        sessionStorage.clear()
      })
      
      // Navigate to protected page
      await page.goto('/dashboard')
      
      // Should redirect to login
      await expect(page).toHaveURL(/\/login/)
      await expect(page.locator('[data-testid="session-expired-message"]')).toBeVisible()
    })

    test('should handle concurrent sessions', async ({ page, context }) => {
      const user = getTestUserByRole('admin')
      
      // Login in first tab
      await login(page, user.email, user.password)
      
      // Open second tab
      const secondPage = await context.newPage()
      await secondPage.goto('/dashboard')
      
      // Should be automatically logged in (shared session)
      await expect(await isLoggedIn(secondPage)).toBe(true)
      
      // Logout from first tab
      await logout(page)
      
      // Second tab should also be logged out
      await secondPage.reload()
      await expect(await isLoggedIn(secondPage)).toBe(false)
      
      await secondPage.close()
    })
  })

  test.describe('Password Reset', () => {
    test('should display password reset form', async ({ page }) => {
      await page.goto('/login')
      
      await page.click('[data-testid="forgot-password-link"]')
      
      await expect(page).toHaveURL(/\/reset-password/)
      await expect(page.locator('[data-testid="reset-password-form"]')).toBeVisible()
      await expect(page.locator('h1')).toContainText('Reset Password')
    })

    test('should send password reset email', async ({ page }) => {
      await page.goto('/reset-password')
      
      const user = getTestUserByRole('admin')
      await page.fill('[data-testid="email-input"]', user.email)
      await page.click('[data-testid="send-reset-button"]')
      
      // Should show success message
      await expect(page.locator('[data-testid="reset-email-sent"]')).toBeVisible()
      await expect(page.locator('[data-testid="reset-email-sent"]')).toContainText(/email sent|check your email/i)
    })
  })

  test.describe('Registration', () => {
    test('should display registration form', async ({ page }) => {
      await page.goto('/login')
      
      await page.click('[data-testid="register-link"]')
      
      await expect(page).toHaveURL(/\/register/)
      await expect(page.locator('[data-testid="registration-form"]')).toBeVisible()
      await expect(page.locator('h1')).toContainText('Register')
    })

    test('should register new user successfully', async ({ page }) => {
      await page.goto('/register')
      
      const newUser = {
        name: 'New Test User',
        email: `newuser-${Date.now()}@test.com`,
        password: 'NewUser123!'
      }
      
      await page.fill('[data-testid="name-input"]', newUser.name)
      await page.fill('[data-testid="email-input"]', newUser.email)
      await page.fill('[data-testid="password-input"]', newUser.password)
      await page.fill('[data-testid="confirm-password-input"]', newUser.password)
      await page.click('[data-testid="register-button"]')
      
      // Should show success message or redirect to verification
      await expect(
        page.locator('[data-testid="registration-success"], [data-testid="verify-email"]')
      ).toBeVisible()
    })
  })
})