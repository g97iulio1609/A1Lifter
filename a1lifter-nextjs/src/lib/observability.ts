// Production-ready observability with Sentry integration
import * as Sentry from "@sentry/nextjs"
import { logger } from "@/lib/logger"

type CaptureOptions = {
  tags?: Record<string, string>
  extra?: Record<string, unknown>
  level?: "info" | "warning" | "error" | "fatal"
}

type MetricTags = Record<string, string>

/**
 * Initialize observability stack
 * Called once at app startup
 */
export function initObservability() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    logger.info("Observability initialized", {
      release: process.env.NEXT_PUBLIC_APP_VERSION || "dev",
      environment: process.env.NODE_ENV,
      sentryEnabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
    })
  }
}

/**
 * Capture exception with full context
 * Sends to Sentry in production, logs in development
 */
export function captureException(err: unknown, opts: CaptureOptions = {}) {
  const message = err instanceof Error ? err.message : String(err)

  // Log locally
  logger.error("Captured exception", {
    message,
    stack: err instanceof Error ? err.stack : undefined,
    ...opts
  })

  // Send to Sentry if enabled
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureException(err, {
      tags: opts.tags,
      extra: opts.extra,
      level: opts.level || "error",
    })
  }
}

/**
 * Capture message/warning with context
 */
export function captureMessage(message: string, opts: CaptureOptions = {}) {
  logger.warn("Captured message", { message, ...opts })

  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureMessage(message, {
      tags: opts.tags,
      extra: opts.extra,
      level: opts.level || "warning",
    })
  }
}

/**
 * Set user context for error tracking
 */
export function setUser(user: { id: string; email?: string; username?: string } | null) {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.setUser(user)
  }
}

/**
 * Add breadcrumb for debugging context
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>
) {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: "info",
      timestamp: Date.now() / 1000,
    })
  }
}

/**
 * Start a performance transaction
 * Returns a function to finish the transaction
 */
export function startTransaction(name: string, op: string) {
  const start = Date.now()

  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    const transaction = Sentry.startInactiveSpan({
      name,
      op,
    })

    return () => {
      const duration = Date.now() - start
      logger.debug("Transaction completed", { name, op, duration })
      transaction?.end()
    }
  }

  return () => {
    const duration = Date.now() - start
    logger.debug("Transaction completed", { name, op, duration })
  }
}

/**
 * Record a metric value
 * Useful for custom performance metrics
 */
export function recordMetric(
  name: string,
  value: number,
  unit: "millisecond" | "byte" | "none" = "none",
  tags?: MetricTags
) {
  logger.debug("Metric recorded", { name, value, unit, tags })

  // Note: Sentry metrics API may not be available in all SDK versions
  // Metrics are logged but not sent to Sentry in this implementation
}

/**
 * Increment a counter metric
 */
export function incrementCounter(name: string, value: number = 1, tags?: MetricTags) {
  logger.debug("Counter incremented", { name, value, tags })

  // Note: Sentry metrics API may not be available in all SDK versions
  // Metrics are logged but not sent to Sentry in this implementation
}

/**
 * Record timing metric
 */
export function recordTiming(name: string, duration: number, tags?: MetricTags) {
  logger.debug("Timing recorded", { name, duration, tags })

  // Note: Sentry metrics API may not be available in all SDK versions
  // Metrics are logged but not sent to Sentry in this implementation
}

/**
 * Wrap an async function with error capture and timing
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withObservability<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  name: string
): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (async (...args: any[]) => {
    const endTransaction = startTransaction(name, "function")
    const start = Date.now()

    try {
      const result = await fn(...args)
      const duration = Date.now() - start
      recordTiming(`function.${name}`, duration, { status: "success" })
      return result
    } catch (error) {
      const duration = Date.now() - start
      recordTiming(`function.${name}`, duration, { status: "error" })
      captureException(error, {
        tags: { function: name },
        extra: { args },
      })
      throw error
    } finally {
      endTransaction()
    }
  }) as T
}

