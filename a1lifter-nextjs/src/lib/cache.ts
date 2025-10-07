import type { Redis } from 'ioredis'
import { getRedisClient, getRedisNamespace, isRedisEnabled } from './redis'
import { logger } from './logger'

type CacheValue<T> = T | undefined

type CacheProvider = 'memory' | 'redis'

export interface CacheClient {
  get<T>(key: string): Promise<CacheValue<T>>
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>
  delete(key: string): Promise<void>
  deletePattern(pattern: string): Promise<void>
  clear(): Promise<void>
  size(): Promise<number>
  readonly provider: CacheProvider
}

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

class MemoryCache implements CacheClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private cache: Map<string, CacheEntry<any>> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null
  readonly provider: CacheProvider = 'memory'

  constructor() {
    this.cleanupInterval = setInterval(() => {
      this.cleanup().catch((error) => {
        logger.error('Memory cache cleanup failed', {
          error: error instanceof Error ? error.message : String(error),
        })
      })
    }, 60000)
  }

  async get<T>(key: string): Promise<CacheValue<T>> {
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

  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    if (typeof ttlSeconds !== 'number' || Number.isNaN(ttlSeconds)) {
      ttlSeconds = 300
    }

    const expiresAt = Date.now() + ttlSeconds * 1000

    this.cache.set(key, {
      value,
      expiresAt,
    })
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key)
  }

  async deletePattern(pattern: string): Promise<void> {
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

  async clear(): Promise<void> {
    this.cache.clear()
  }

  async size(): Promise<number> {
    return this.cache.size
  }

  async destroy(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    await this.clear()
  }

  private async cleanup(): Promise<void> {
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
}

class RedisCache implements CacheClient {
  private readonly namespace: string
  readonly provider: CacheProvider = 'redis'

  constructor(private readonly client: Redis, namespace: string) {
    this.namespace = namespace
  }

  private keyWithNamespace(key: string) {
    return `${this.namespace}:${key}`
  }

  private patternWithNamespace(pattern: string) {
    if (!pattern.includes('*')) {
      return this.keyWithNamespace(pattern)
    }

    return `${this.namespace}:${pattern}`
  }

  async get<T>(key: string): Promise<CacheValue<T>> {
    const namespacedKey = this.keyWithNamespace(key)

    try {
      const value = await this.client.get(namespacedKey)
      if (!value) {
        return undefined
      }

      return JSON.parse(value) as T
    } catch (error) {
      logger.error('Redis cache get failed', {
        key,
        error: error instanceof Error ? error.message : String(error),
      })
      return undefined
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    if (value === undefined) {
      return
    }

    const namespacedKey = this.keyWithNamespace(key)

    try {
      const serialized = JSON.stringify(value)
      if (serialized === undefined) {
        return
      }

      if (ttlSeconds && ttlSeconds > 0) {
        await this.client.set(namespacedKey, serialized, 'EX', Math.floor(ttlSeconds))
      } else {
        await this.client.set(namespacedKey, serialized)
      }
    } catch (error) {
      logger.error('Redis cache set failed', {
        key,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.del(this.keyWithNamespace(key))
    } catch (error) {
      logger.error('Redis cache delete failed', {
        key,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    try {
      const namespacedPattern = this.patternWithNamespace(pattern)
      let cursor = '0'
      do {
        const [nextCursor, keys] = await this.client.scan(
          cursor,
          'MATCH',
          namespacedPattern,
          'COUNT',
          100
        )

        if (keys.length) {
          const pipeline = this.client.pipeline()
          keys.forEach((key) => pipeline.del(key))
          await pipeline.exec()
        }

        cursor = nextCursor
      } while (cursor !== '0')
    } catch (error) {
      logger.error('Redis cache delete pattern failed', {
        pattern,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  async clear(): Promise<void> {
    await this.deletePattern('*')
  }

  async size(): Promise<number> {
    let cursor = '0'
    let count = 0
    const namespacedPattern = this.patternWithNamespace('*')

    do {
      const [nextCursor, keys] = await this.client.scan(cursor, 'MATCH', namespacedPattern, 'COUNT', 100)
      count += keys.length
      cursor = nextCursor
    } while (cursor !== '0')

    return count
  }
}

function createCacheClient(): CacheClient {
  const redisClient = getRedisClient()
  if (redisClient && isRedisEnabled()) {
    logger.info('Using Redis cache provider')
    return new RedisCache(redisClient, getRedisNamespace())
  }

  logger.info('Using in-memory cache provider')
  return new MemoryCache()
}

export const cache = createCacheClient()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    keyPrefix: string
    ttl?: number
    keyGenerator?: (...args: Parameters<T>) => string
  }
): T {
  return (async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    const key = options.keyGenerator
      ? `${options.keyPrefix}:${options.keyGenerator(...args)}`
      : `${options.keyPrefix}:${JSON.stringify(args)}`

    const cached = await cache.get<Awaited<ReturnType<T>>>(key)
    if (cached !== undefined) {
      return cached
    }

    const result = await fn(...args)
    await cache.set(key, result, options.ttl ?? 300)

    return result
  }) as T
}

export const cacheKeys = {
  event: (id: string) => `event:${id}`,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  eventList: (filters?: Record<string, any>) => `events:${filters ? JSON.stringify(filters) : 'all'}`,
  athlete: (id: string) => `athlete:${id}`,
  athleteStats: (id: string, eventId?: string) => `athlete:${id}:stats${eventId ? `:${eventId}` : ''}`,
  leaderboard: (eventId: string, categoryId?: string) =>
    `leaderboard:${eventId}${categoryId ? `:${categoryId}` : ''}`,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attempts: (eventId: string, filters?: Record<string, any>) =>
    `attempts:${eventId}:${filters ? JSON.stringify(filters) : 'all'}`,
  dashboard: () => 'dashboard:stats',
  notifications: (userId: string, unreadOnly?: boolean) =>
    `notifications:${userId}${unreadOnly ? ':unread' : ''}`,
}

export const invalidateCache = {
  event: async (id: string) => {
    await cache.delete(cacheKeys.event(id))
    await cache.deletePattern(`events:*`)
    await cache.deletePattern(`leaderboard:${id}*`)
  },
  athlete: async (id: string) => {
    await cache.delete(cacheKeys.athlete(id))
    await cache.deletePattern(`athlete:${id}:*`)
  },
  leaderboard: async (eventId: string) => {
    await cache.deletePattern(`leaderboard:${eventId}*`)
  },
  attempts: async (eventId: string) => {
    await cache.deletePattern(`attempts:${eventId}*`)
    await cache.deletePattern(`leaderboard:${eventId}*`)
  },
  dashboard: async () => {
    await cache.delete(cacheKeys.dashboard())
  },
  notifications: async (userId: string) => {
    await cache.deletePattern(`notifications:${userId}*`)
  },
  all: async () => {
    await cache.clear()
  },
}

export const cacheProvider = cache.provider
