import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { cache, withCache, cacheKeys, invalidateCache } from '@/lib/cache'

describe('MemoryCache', () => {
  beforeEach(() => {
    cache.clear()
  })

  afterEach(() => {
    cache.clear()
  })

  describe('get/set', () => {
    it('should store and retrieve values', () => {
      cache.set('key1', 'value1', 60)
      expect(cache.get('key1')).toBe('value1')
    })

    it('should return undefined for non-existent keys', () => {
      expect(cache.get('non-existent')).toBeUndefined()
    })

    it('should handle different data types', () => {
      cache.set('string', 'test', 60)
      cache.set('number', 42, 60)
      cache.set('object', { foo: 'bar' }, 60)
      cache.set('array', [1, 2, 3], 60)

      expect(cache.get('string')).toBe('test')
      expect(cache.get('number')).toBe(42)
      expect(cache.get('object')).toEqual({ foo: 'bar' })
      expect(cache.get('array')).toEqual([1, 2, 3])
    })
  })

  describe('TTL', () => {
    it('should expire after TTL', async () => {
      cache.set('key1', 'value1', 1) // 1 second TTL

      expect(cache.get('key1')).toBe('value1')

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 1100))

      expect(cache.get('key1')).toBeUndefined()
    })
  })

  describe('delete', () => {
    it('should delete a key', () => {
      cache.set('key1', 'value1', 60)
      expect(cache.get('key1')).toBe('value1')

      cache.delete('key1')
      expect(cache.get('key1')).toBeUndefined()
    })
  })

  describe('deletePattern', () => {
    it('should delete keys matching pattern', () => {
      cache.set('event:123', 'data1', 60)
      cache.set('event:456', 'data2', 60)
      cache.set('athlete:789', 'data3', 60)

      cache.deletePattern('event:*')

      expect(cache.get('event:123')).toBeUndefined()
      expect(cache.get('event:456')).toBeUndefined()
      expect(cache.get('athlete:789')).toBe('data3')
    })
  })

  describe('clear', () => {
    it('should clear all entries', () => {
      cache.set('key1', 'value1', 60)
      cache.set('key2', 'value2', 60)

      expect(cache.size()).toBe(2)

      cache.clear()

      expect(cache.size()).toBe(0)
      expect(cache.get('key1')).toBeUndefined()
      expect(cache.get('key2')).toBeUndefined()
    })
  })

  describe('size', () => {
    it('should return cache size', () => {
      expect(cache.size()).toBe(0)

      cache.set('key1', 'value1', 60)
      expect(cache.size()).toBe(1)

      cache.set('key2', 'value2', 60)
      expect(cache.size()).toBe(2)

      cache.delete('key1')
      expect(cache.size()).toBe(1)
    })
  })
})

describe('withCache', () => {
  beforeEach(() => {
    cache.clear()
  })

  afterEach(() => {
    cache.clear()
  })

  it('should cache function results', async () => {
    let callCount = 0
    const fn = vi.fn(async (id: string) => {
      callCount++
      return `result-${id}`
    })

    const cachedFn = withCache(fn, {
      keyPrefix: 'test',
      ttl: 60,
      keyGenerator: (id) => id,
    })

    const result1 = await cachedFn('123')
    const result2 = await cachedFn('123')

    expect(result1).toBe('result-123')
    expect(result2).toBe('result-123')
    expect(callCount).toBe(1) // Should only call once
  })

  it('should call function again after TTL expires', async () => {
    let callCount = 0
    const fn = vi.fn(async () => {
      callCount++
      return 'result'
    })

    const cachedFn = withCache(fn, {
      keyPrefix: 'test',
      ttl: 1, // 1 second
    })

    await cachedFn()
    expect(callCount).toBe(1)

    // Wait for expiration
    await new Promise((resolve) => setTimeout(resolve, 1100))

    await cachedFn()
    expect(callCount).toBe(2)
  })

  it('should cache different results for different args', async () => {
    const fn = vi.fn(async (id: string) => `result-${id}`)

    const cachedFn = withCache(fn, {
      keyPrefix: 'test',
      ttl: 60,
      keyGenerator: (id) => id,
    })

    const result1 = await cachedFn('123')
    const result2 = await cachedFn('456')

    expect(result1).toBe('result-123')
    expect(result2).toBe('result-456')
    expect(fn).toHaveBeenCalledTimes(2)
  })
})

describe('cacheKeys', () => {
  it('should generate consistent keys', () => {
    expect(cacheKeys.event('123')).toBe('event:123')
    expect(cacheKeys.athlete('456')).toBe('athlete:456')
    expect(cacheKeys.leaderboard('789')).toBe('leaderboard:789')
    expect(cacheKeys.leaderboard('789', 'cat1')).toBe('leaderboard:789:cat1')
  })

  it('should handle filters in keys', () => {
    const filters = { status: 'APPROVED' }
    const key = cacheKeys.eventList(filters)
    expect(key).toContain('events:')
    expect(key).toContain('APPROVED')
  })
})

describe('invalidateCache', () => {
  beforeEach(() => {
    cache.clear()
  })

  afterEach(() => {
    cache.clear()
  })

  it('should invalidate event and related caches', () => {
    cache.set('event:123', 'data', 60)
    cache.set('events:all', 'list', 60)
    cache.set('leaderboard:123', 'scores', 60)
    cache.set('athlete:456', 'athlete', 60)

    invalidateCache.event('123')

    expect(cache.get('event:123')).toBeUndefined()
    expect(cache.get('events:all')).toBeUndefined()
    expect(cache.get('leaderboard:123')).toBeUndefined()
    expect(cache.get('athlete:456')).toBe('athlete') // Should not be affected
  })

  it('should invalidate athlete cache', () => {
    cache.set('athlete:123', 'data', 60)
    cache.set('athlete:123:stats', 'stats', 60)
    cache.set('event:456', 'event', 60)

    invalidateCache.athlete('123')

    expect(cache.get('athlete:123')).toBeUndefined()
    expect(cache.get('athlete:123:stats')).toBeUndefined()
    expect(cache.get('event:456')).toBe('event') // Should not be affected
  })

  it('should clear all caches', () => {
    cache.set('key1', 'value1', 60)
    cache.set('key2', 'value2', 60)
    cache.set('key3', 'value3', 60)

    expect(cache.size()).toBe(3)

    invalidateCache.all()

    expect(cache.size()).toBe(0)
  })
})
