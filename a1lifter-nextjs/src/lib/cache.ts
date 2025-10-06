/**
 * Simple in-memory cache with TTL support
 * For production with multiple instances, use Redis or similar
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

class MemoryCache {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private cache: Map<string, CacheEntry<any>> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60000)
  }

  /**
   * Get a value from cache
   * Returns undefined if not found or expired
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key)

    if (!entry) {
      return undefined
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return undefined
    }

    return entry.value
  }

  /**
   * Set a value in cache with TTL in seconds
   */
  set<T>(key: string, value: T, ttlSeconds: number = 300): void {
    const expiresAt = Date.now() + ttlSeconds * 1000

    this.cache.set(key, {
      value,
      expiresAt,
    })
  }

  /**
   * Delete a value from cache
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Delete all keys matching a pattern
   */
  deletePattern(pattern: string): void {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'))
    const keysToDelete: string[] = []

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key)
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key)
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key)
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key)
    }
  }

  /**
   * Stop cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }
}

// Global cache instance
export const cache = new MemoryCache()

/**
 * Cache decorator for async functions
 * Automatically caches function results based on arguments
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    keyPrefix: string
    ttl?: number
    keyGenerator?: (...args: Parameters<T>) => string
  }
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const key = options.keyGenerator
      ? `${options.keyPrefix}:${options.keyGenerator(...args)}`
      : `${options.keyPrefix}:${JSON.stringify(args)}`

    // Try to get from cache
    const cached = cache.get<ReturnType<T>>(key)
    if (cached !== undefined) {
      return cached
    }

    // Execute function and cache result
    const result = await fn(...args)
    cache.set(key, result, options.ttl || 300)

    return result
  }) as T
}

/**
 * Cache key generators for common patterns
 */
export const cacheKeys = {
  event: (id: string) => `event:${id}`,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  eventList: (filters?: Record<string, any>) =>
    `events:${filters ? JSON.stringify(filters) : 'all'}`,
  athlete: (id: string) => `athlete:${id}`,
  athleteStats: (id: string, eventId?: string) =>
    `athlete:${id}:stats${eventId ? `:${eventId}` : ''}`,
  leaderboard: (eventId: string, categoryId?: string) =>
    `leaderboard:${eventId}${categoryId ? `:${categoryId}` : ''}`,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attempts: (eventId: string, filters?: Record<string, any>) =>
    `attempts:${eventId}:${filters ? JSON.stringify(filters) : 'all'}`,
  dashboard: () => 'dashboard:stats',
  notifications: (userId: string, unreadOnly?: boolean) =>
    `notifications:${userId}${unreadOnly ? ':unread' : ''}`,
}

/**
 * Cache invalidation helpers
 */
export const invalidateCache = {
  event: (id: string) => {
    cache.delete(cacheKeys.event(id))
    cache.deletePattern(`events:*`)
    cache.deletePattern(`leaderboard:${id}*`)
  },
  athlete: (id: string) => {
    cache.delete(cacheKeys.athlete(id))
    cache.deletePattern(`athlete:${id}:*`)
  },
  leaderboard: (eventId: string) => {
    cache.deletePattern(`leaderboard:${eventId}*`)
  },
  attempts: (eventId: string) => {
    cache.deletePattern(`attempts:${eventId}*`)
    cache.deletePattern(`leaderboard:${eventId}*`)
  },
  dashboard: () => {
    cache.delete(cacheKeys.dashboard())
  },
  notifications: (userId: string) => {
    cache.deletePattern(`notifications:${userId}*`)
  },
  all: () => {
    cache.clear()
  },
}
