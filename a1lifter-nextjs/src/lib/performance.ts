/**
 * Performance profiling and optimization utilities
 */

import { logger } from "@/lib/logger"
import { recordTiming } from "@/lib/observability"

/**
 * Measure execution time of a function
 */
export async function measureTime<T>(
  fn: () => Promise<T> | T,
  label: string
): Promise<{ result: T; duration: number }> {
  const start = performance.now()

  try {
    const result = await fn()
    const duration = performance.now() - start

    logger.debug(`[Performance] ${label}: ${duration.toFixed(2)}ms`)
    recordTiming(label, duration)

    return { result, duration }
  } catch (error) {
    const duration = performance.now() - start
    logger.error(`[Performance] ${label} failed after ${duration.toFixed(2)}ms`, { error })
    throw error
  }
}

/**
 * Performance profiler for complex operations
 */
export class Profiler {
  private marks: Map<string, number> = new Map()
  private measurements: Array<{ label: string; duration: number }> = []
  private startTime: number

  constructor(private label: string) {
    this.startTime = performance.now()
  }

  /**
   * Mark a checkpoint
   */
  mark(name: string): void {
    this.marks.set(name, performance.now())
  }

  /**
   * Measure between two marks
   */
  measure(label: string, startMark: string, endMark?: string): number {
    const start = this.marks.get(startMark)
    const end = endMark ? this.marks.get(endMark) : performance.now()

    if (!start) {
      throw new Error(`Start mark "${startMark}" not found`)
    }
    if (endMark && !end) {
      throw new Error(`End mark "${endMark}" not found`)
    }

    const duration = (end || performance.now()) - start
    this.measurements.push({ label, duration })

    logger.debug(`[Profiler/${this.label}] ${label}: ${duration.toFixed(2)}ms`)
    recordTiming(`profiler.${this.label}.${label}`, duration)

    return duration
  }

  /**
   * Get all measurements
   */
  getMeasurements(): Array<{ label: string; duration: number }> {
    return [...this.measurements]
  }

  /**
   * Get total elapsed time
   */
  getTotal(): number {
    return performance.now() - this.startTime
  }

  /**
   * Log summary of all measurements
   */
  logSummary(): void {
    const total = this.getTotal()

    logger.info(`[Profiler/${this.label}] Summary:`, {
      total: `${total.toFixed(2)}ms`,
      measurements: this.measurements.map((m) => ({
        label: m.label,
        duration: `${m.duration.toFixed(2)}ms`,
        percentage: `${((m.duration / total) * 100).toFixed(1)}%`,
      })),
    })
  }
}

/**
 * Batch operations for better performance
 */
export async function batchProcess<T, R>(
  items: T[],
  processor: (batch: T[]) => Promise<R[]>,
  batchSize: number = 50
): Promise<R[]> {
  const results: R[] = []
  const totalBatches = Math.ceil(items.length / batchSize)

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchNumber = Math.floor(i / batchSize) + 1

    const { result } = await measureTime(
      () => processor(batch),
      `Batch ${batchNumber}/${totalBatches}`
    )

    results.push(...result)
  }

  return results
}

/**
 * Parallel execution with concurrency limit
 */
export async function parallelLimit<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  concurrency: number = 5
): Promise<R[]> {
  const results: R[] = []
  const executing: Promise<void>[] = []

  for (const item of items) {
    const promise = processor(item).then((result) => {
      results.push(result)
    })

    executing.push(promise)

    if (executing.length >= concurrency) {
      await Promise.race(executing)
      executing.splice(
        executing.findIndex((p) => p === promise),
        1
      )
    }
  }

  await Promise.all(executing)
  return results
}

/**
 * Debounce function calls
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn(...args)
    }, delay)
  }
}

/**
 * Throttle function calls
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

/**
 * Memoize expensive computations
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  options: {
    maxSize?: number
    keyGenerator?: (...args: Parameters<T>) => string
  } = {}
): T {
  const cache = new Map<string, ReturnType<T>>()
  const maxSize = options.maxSize || 100

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = options.keyGenerator
      ? options.keyGenerator(...args)
      : JSON.stringify(args)

    if (cache.has(key)) {
      return cache.get(key)!
    }

    const result = fn(...args)

    // LRU eviction
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value
      if (firstKey !== undefined) {
        cache.delete(firstKey)
      }
    }

    cache.set(key, result)
    return result
  }) as T
}

/**
 * Performance budget checker
 */
export class PerformanceBudget {
  constructor(
    private budget: number,
    private label: string
  ) {}

  async check<T>(fn: () => Promise<T>): Promise<T> {
    const { result, duration } = await measureTime(fn, this.label)

    if (duration > this.budget) {
      logger.warn(
        `[Performance Budget] ${this.label} exceeded budget: ${duration.toFixed(2)}ms > ${this.budget}ms`
      )
    }

    return result
  }
}
