import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as Sentry from '@sentry/nextjs'
import {
  captureException,
  captureMessage,
  setUser,
  addBreadcrumb,
  recordMetric,
  incrementCounter,
  recordTiming,
  withObservability,
} from '@/lib/observability'
import { logger } from '@/lib/logger'

// Mock Sentry
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  setUser: vi.fn(),
  addBreadcrumb: vi.fn(),
  metrics: {
    gauge: vi.fn(),
    increment: vi.fn(),
    distribution: vi.fn(),
  },
  startInactiveSpan: vi.fn(() => ({
    end: vi.fn(),
  })),
}))

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

describe('Observability', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Simulate Sentry DSN not configured by default
    delete process.env.NEXT_PUBLIC_SENTRY_DSN
  })

  describe('captureException', () => {
    it('should log exception', () => {
      const error = new Error('Test error')
      captureException(error)

      expect(logger.error).toHaveBeenCalledWith('Captured exception', {
        message: 'Test error',
        stack: expect.any(String),
      })
    })

    it('should send to Sentry if DSN configured', () => {
      process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://test@sentry.io/1'
      const error = new Error('Test error')
      captureException(error, { tags: { route: 'test' } })

      expect(Sentry.captureException).toHaveBeenCalledWith(error, {
        tags: { route: 'test' },
        extra: undefined,
        level: 'error',
      })
    })

    it('should not send to Sentry if DSN not configured', () => {
      const error = new Error('Test error')
      captureException(error)

      expect(Sentry.captureException).not.toHaveBeenCalled()
    })

    it('should handle non-Error objects', () => {
      captureException('string error')

      expect(logger.error).toHaveBeenCalledWith('Captured exception', {
        message: 'string error',
        stack: undefined,
      })
    })
  })

  describe('captureMessage', () => {
    it('should log message', () => {
      captureMessage('Test message')

      expect(logger.warn).toHaveBeenCalledWith('Captured message', {
        message: 'Test message',
      })
    })

    it('should send to Sentry if DSN configured', () => {
      process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://test@sentry.io/1'
      captureMessage('Test message', { level: 'info' })

      expect(Sentry.captureMessage).toHaveBeenCalledWith('Test message', {
        tags: undefined,
        extra: undefined,
        level: 'info',
      })
    })
  })

  describe('setUser', () => {
    it('should set user in Sentry if DSN configured', () => {
      process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://test@sentry.io/1'
      const user = { id: '123', email: 'test@example.com' }
      setUser(user)

      expect(Sentry.setUser).toHaveBeenCalledWith(user)
    })

    it('should handle null user', () => {
      process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://test@sentry.io/1'
      setUser(null)

      expect(Sentry.setUser).toHaveBeenCalledWith(null)
    })
  })

  describe('addBreadcrumb', () => {
    it('should add breadcrumb in Sentry if DSN configured', () => {
      process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://test@sentry.io/1'
      addBreadcrumb('Test breadcrumb', 'navigation', { path: '/test' })

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        message: 'Test breadcrumb',
        category: 'navigation',
        data: { path: '/test' },
        level: 'info',
        timestamp: expect.any(Number),
      })
    })
  })

  describe('recordMetric', () => {
    it('should log metric', () => {
      recordMetric('api.latency', 123, 'millisecond')

      expect(logger.debug).toHaveBeenCalledWith('Metric recorded', {
        name: 'api.latency',
        value: 123,
        unit: 'millisecond',
        tags: undefined,
      })
    })

    it('should send to Sentry if DSN configured', () => {
      process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://test@sentry.io/1'
      recordMetric('api.latency', 123, 'millisecond', { route: '/test' })

      expect(Sentry.metrics.gauge).toHaveBeenCalledWith('api.latency', 123, {
        unit: 'millisecond',
        tags: { route: '/test' },
      })
    })
  })

  describe('incrementCounter', () => {
    it('should log counter', () => {
      incrementCounter('api.requests', 1, { status: '200' })

      expect(logger.debug).toHaveBeenCalledWith('Counter incremented', {
        name: 'api.requests',
        value: 1,
        tags: { status: '200' },
      })
    })

    it('should send to Sentry if DSN configured', () => {
      process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://test@sentry.io/1'
      incrementCounter('api.requests', 5)

      expect(Sentry.metrics.increment).toHaveBeenCalledWith('api.requests', 5, {
        tags: undefined,
      })
    })
  })

  describe('recordTiming', () => {
    it('should log timing', () => {
      recordTiming('db.query', 45)

      expect(logger.debug).toHaveBeenCalledWith('Timing recorded', {
        name: 'db.query',
        duration: 45,
        tags: undefined,
      })
    })

    it('should send to Sentry if DSN configured', () => {
      process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://test@sentry.io/1'
      recordTiming('db.query', 45, { query: 'SELECT' })

      expect(Sentry.metrics.distribution).toHaveBeenCalledWith('db.query', 45, {
        unit: 'millisecond',
        tags: { query: 'SELECT' },
      })
    })
  })

  describe('withObservability', () => {
    it('should wrap function and record success', async () => {
      const testFn = vi.fn().mockResolvedValue('success')
      const wrapped = withObservability(testFn, 'testFunction')

      const result = await wrapped('arg1', 'arg2')

      expect(result).toBe('success')
      expect(testFn).toHaveBeenCalledWith('arg1', 'arg2')
      expect(logger.debug).toHaveBeenCalledWith('Transaction completed', {
        name: 'testFunction',
        op: 'function',
        duration: expect.any(Number),
      })
    })

    it('should capture error and rethrow', async () => {
      const error = new Error('Test error')
      const testFn = vi.fn().mockRejectedValue(error)
      const wrapped = withObservability(testFn, 'testFunction')

      await expect(wrapped()).rejects.toThrow('Test error')
      expect(logger.error).toHaveBeenCalled()
    })
  })
})
