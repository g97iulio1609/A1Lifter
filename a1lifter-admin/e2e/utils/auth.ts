import { Page, expect } from '@playwright/test'
import path from 'path'
import fs from 'fs'

/**
 * Authentication utilities for E2E tests
 * Handles login, logout, and user role management
 */

interface TestUser {
  email: string
  password: string
  role: string
  name: string
}

/**
 * Get test users data
 */
export function getTestUsers(): TestUser[] {
  const testDataPath = path.join(__dirname, '..', 'test-data', 'test-users.json')
  
  if (!fs.existsSync(testDataPath)) {
    // Fallback test users if file doesn't exist
    return [
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
  }
  
  return JSON.parse(fs.readFileSync(testDataPath, 'utf-8'))
}

/**
 * Get test user by role
 */
export function getTestUserByRole(role: string): TestUser {
  const users = getTestUsers()
  const user = users.find(u => u.role === role)
  
  if (!user) {
    throw new Error(`Test user with role '${role}' not found`)
  }
  
  return user
}

/**
 * Login with email and password
 */
export async function login(page: Page, email: string, password: string) {
  // Navigate to login page
  await page.goto('/login')
  
  // Wait for login form to be visible
  await expect(page.locator('[data-testid="login-form"]')).toBeVisible()
  
  // Fill login form
  await page.fill('[data-testid="email-input"]', email)
  await page.fill('[data-testid="password-input"]', password)
  
  // Submit form
  await page.click('[data-testid="login-button"]')
  
  // Wait for successful login (redirect to dashboard or home)
  await page.waitForURL(/\/(dashboard|home|events)/, { timeout: 10000 })
  
  // Verify user is logged in
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
}

/**
 * Login with specific user role
 */
export async function loginAsRole(page: Page, role: string) {
  const user = getTestUserByRole(role)
  await login(page, user.email, user.password)
  
  // Verify role-specific elements are visible
  switch (role) {
    case 'admin':
      await expect(page.locator('[data-testid="admin-menu"]')).toBeVisible()
      break
    case 'organizer':
      await expect(page.locator('[data-testid="organizer-menu"]')).toBeVisible()
      break
    case 'judge':
      await expect(page.locator('[data-testid="judge-menu"]')).toBeVisible()
      break
    case 'athlete':
      await expect(page.locator('[data-testid="athlete-menu"]')).toBeVisible()
      break
  }
}

/**
 * Logout current user
 */
export async function logout(page: Page) {
  // Click user menu
  await page.click('[data-testid="user-menu"]')
  
  // Click logout button
  await page.click('[data-testid="logout-button"]')
  
  // Wait for redirect to login or home page
  await page.waitForURL(/\/(login|home|\/?)$/, { timeout: 5000 })
  
  // Verify user is logged out
  await expect(page.locator('[data-testid="user-menu"]')).not.toBeVisible()
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible({ timeout: 2000 })
    return true
  } catch {
    return false
  }
}

/**
 * Get current user info from the page
 */
export async function getCurrentUser(page: Page): Promise<{ name: string; email: string; role: string } | null> {
  if (!(await isLoggedIn(page))) {
    return null
  }
  
  // Click user menu to reveal user info
  await page.click('[data-testid="user-menu"]')
  
  try {
    const name = await page.textContent('[data-testid="user-name"]')
    const email = await page.textContent('[data-testid="user-email"]')
    const role = await page.textContent('[data-testid="user-role"]')
    
    // Close user menu
    await page.click('[data-testid="user-menu"]')
    
    return {
      name: name || '',
      email: email || '',
      role: role || ''
    }
  } catch {
    // Close user menu if it was opened
    await page.click('[data-testid="user-menu"]')
    return null
  }
}

/**
 * Setup authentication state for a specific user role
 * This can be used to skip login in tests that don't need to test authentication
 */
export async function setupAuthState(page: Page, role: string) {
  const user = getTestUserByRole(role)
  
  // Set authentication cookies/localStorage directly
  await page.addInitScript((userData) => {
    // Mock authentication state
    localStorage.setItem('a1lifter-auth', JSON.stringify({
      user: {
        uid: `test-${userData.role}-uid`,
        email: userData.email,
        displayName: userData.name,
        role: userData.role
      },
      token: 'mock-jwt-token',
      expiresAt: Date.now() + 3600000 // 1 hour from now
    }))
  }, user)
  
  // Set auth cookies if needed
  await page.context().addCookies([
    {
      name: 'a1lifter-session',
      value: `mock-session-${role}`,
      domain: 'localhost',
      path: '/'
    }
  ])
}

/**
 * Clear authentication state
 */
export async function clearAuthState(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('a1lifter-auth')
    sessionStorage.clear()
  })
  
  // Clear auth cookies
  await page.context().clearCookies()
}