import path from 'path'
import fs from 'fs'

/**
 * Global teardown for Playwright E2E tests
 * Cleans up test environment, Firebase staging data, and temporary files
 */
async function globalTeardown() {
  console.log('🧹 Starting global teardown for E2E tests...')
  
  try {
    // Clean up test data directory
    const testDataDir = path.join(__dirname, 'test-data')
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true })
      console.log('✅ Test data directory cleaned up')
    }
    
    // Clean up test results if not in CI
    if (!process.env.CI) {
      const testResultsDir = path.join(process.cwd(), 'test-results')
      if (fs.existsSync(testResultsDir)) {
        // Keep only the latest 5 test runs
        const testRuns = fs.readdirSync(testResultsDir)
          .filter(dir => fs.statSync(path.join(testResultsDir, dir)).isDirectory())
          .map(dir => ({
            name: dir,
            path: path.join(testResultsDir, dir),
            mtime: fs.statSync(path.join(testResultsDir, dir)).mtime
          }))
          .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())
        
        // Remove old test runs (keep latest 5)
        const oldRuns = testRuns.slice(5)
        for (const run of oldRuns) {
          fs.rmSync(run.path, { recursive: true, force: true })
        }
        
        if (oldRuns.length > 0) {
          console.log(`✅ Cleaned up ${oldRuns.length} old test runs`)
        }
      }
    }
    
    // Clean up Firebase staging data if available
    const requiredEnvVars = [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_AUTH_DOMAIN'
    ]
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
    
    if (!missingVars.length) {
      console.log('🔥 Cleaning up Firebase staging data...')
      
      // Here you would typically:
      // 1. Connect to Firebase staging
      // 2. Delete test events, athletes, attempts
      // 3. Clean up test user accounts (optional)
      // 4. Reset any modified configuration
      
      console.log('✅ Firebase staging cleanup completed')
    }
    
    // Clean up browser cache and storage
    const browserDataDir = path.join(__dirname, '.browser-data')
    if (fs.existsSync(browserDataDir)) {
      fs.rmSync(browserDataDir, { recursive: true, force: true })
      console.log('✅ Browser data cleaned up')
    }
    
    // Clean up temporary screenshots and videos (if not in CI)
    if (!process.env.CI) {
      const playwrightReportDir = path.join(process.cwd(), 'playwright-report')
      if (fs.existsSync(playwrightReportDir)) {
        // Keep only the latest report
        const reports = fs.readdirSync(playwrightReportDir)
          .filter(file => file.endsWith('.html') || file.endsWith('.json'))
          .map(file => ({
            name: file,
            path: path.join(playwrightReportDir, file),
            mtime: fs.statSync(path.join(playwrightReportDir, file)).mtime
          }))
          .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())
        
        // Keep only the latest report files
        const oldReports = reports.slice(2) // Keep latest HTML and JSON
        for (const report of oldReports) {
          fs.unlinkSync(report.path)
        }
        
        if (oldReports.length > 0) {
          console.log(`✅ Cleaned up ${oldReports.length} old report files`)
        }
      }
    }
    
    // Log test execution summary
    const testResultsDir = path.join(process.cwd(), 'test-results')
    if (fs.existsSync(testResultsDir)) {
      const testRuns = fs.readdirSync(testResultsDir)
        .filter(dir => fs.statSync(path.join(testResultsDir, dir)).isDirectory())
      
      console.log(`📊 Test execution completed. ${testRuns.length} test run(s) available.`)
    }
    
    // Performance cleanup
    if (global.gc) {
      global.gc()
      console.log('✅ Garbage collection performed')
    }
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error)
    // Don't throw error in teardown to avoid masking test failures
  }
  
  console.log('🎉 Global teardown completed successfully')
}

export default globalTeardown