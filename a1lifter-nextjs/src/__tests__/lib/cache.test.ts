import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { cache, withCache, cacheKeys, invalidateCache } from '@/lib/cache'

describe('Cache client', () => {
  beforeEach(async () => {
    await cache.clear()
  })

  afterEach(async () => {
    await cache.clear()
  })

  describe('basic operations', () => {
    it('stores and retrieves values', async () => {
      await cache.set('key1', 'value1', 60)
      await cache.set('key2', 42, 60)

      expect(await cache.get('key1')).toBe('value1')
      expect(await cache.get('key2')).toBe(42)
    })

    it('returns undefined for missing values', async () => {
      expect(await cache.get('missing')).toBeUndefined()
    })

    it('handles complex values', async () => {
      await cache.set('object', { foo: 'bar' }, 60)
      await cache.set('array', [1, 2, 3], 60)

      expect(await cache.get('object')).toEqual({ foo: 'bar' })
      expect(await cache.get('array')).toEqual([1, 2, 3])
    })
  })

  describe('ttl', () => {
    it('expires after ttl', async () => {
      await cache.set('temp', 'value', 1)
      expect(await cache.get('temp')).toBe('value')

      await new Promise((resolve) => setTimeout(resolve, 1100))

      expect(await cache.get('temp')).toBeUndefined()
    })
  })

  describe('deletion', () => {
    it('removes a single key', async () => {
      await cache.set('single', 'value', 60)
      expect(await cache.get('single')).toBe('value')

      await cache.delete('single')
      expect(await cache.get('single')).toBeUndefined()
    })

    it('removes keys by pattern', async () => {
      await cache.set('event:1', 'event-1', 60)
      await cache.set('event:2', 'event-2', 60)
      await cache.set('athlete:1', 'athlete-1', 60)

      await cache.deletePattern('event:*')

      expect(await cache.get('event:1')).toBeUndefined()
      expect(await cache.get('event:2')).toBeUndefined()
      expect(await cache.get('athlete:1')).toBe('athlete-1')
    })

    it('clears all entries', async () => {
      await cache.set('k1', 'v1', 60)
      await cache.set('k2', 'v2', 60)

      expect(await cache.size()).toBe(2)

      await cache.clear()

      expect(await cache.size()).toBe(0)
      expect(await cache.get('k1')).toBeUndefined()
      expect(await cache.get('k2')).toBeUndefined()
    })
  })

  describe('size', () => {
    it('returns the number of cached items', async () => {
      expect(await cache.size()).toBe(0)

      await cache.set('one', '1', 60)
      await cache.set('two', '2', 60)

      expect(await cache.size()).toBe(2)

      await cache.delete('one')
      expect(await cache.size()).toBe(1)
    })
  })
})

describe('withCache', () => {
  beforeEach(async () => {
    await cache.clear()
  })

  afterEach(async () => {
    await cache.clear()
  })

  it('caches function results', async () => {
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
    expect(callCount).toBe(1)
  })

  it('recomputes after ttl expires', async () => {
    let callCount = 0
    const fn = vi.fn(async () => {
      callCount++
      return 'result'
    })

    const cachedFn = withCache(fn, {
      keyPrefix: 'test',
      ttl: 1,
    })

    await cachedFn()
    expect(callCount).toBe(1)

    await new Promise((resolve) => setTimeout(resolve, 1100))

    await cachedFn()
    expect(callCount).toBe(2)
  })

  it('creates unique cache keys per argument', async () => {
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
  it('generates deterministic keys', () => {
    expect(cacheKeys.event('123')).toBe('event:123')
    expect(cacheKeys.athlete('456')).toBe('athlete:456')
    expect(cacheKeys.leaderboard('789')).toBe('leaderboard:789')
    expect(cacheKeys.leaderboard('789', 'cat1')).toBe('leaderboard:789:cat1')
  })

  it('serializes filters in keys', () => {
    const filters = { status: 'APPROVED' }
    const key = cacheKeys.eventList(filters)
    expect(key).toContain('events:')
    expect(key).toContain('APPROVED')
  })
})

describe('invalidateCache', () => {
  beforeEach(async () => {
    await cache.clear()
  })

  afterEach(async () => {
    await cache.clear()
  })

  it('invalidates event-related caches', async () => {
    await cache.set('event:123', 'event-data', 60)
    await cache.set('events:all', 'event-list', 60)
    await cache.set('leaderboard:123', 'scores', 60)
    await cache.set('athlete:456', 'athlete', 60)

    await invalidateCache.event('123')

    expect(await cache.get('event:123')).toBeUndefined()
    expect(await cache.get('events:all')).toBeUndefined()
    expect(await cache.get('leaderboard:123')).toBeUndefined()
    expect(await cache.get('athlete:456')).toBe('athlete')
  })

  it('invalidates athlete caches', async () => {
    await cache.set('athlete:123', 'data', 60)
    await cache.set('athlete:123:stats', 'stats', 60)
    await cache.set('event:456', 'event', 60)

    await invalidateCache.athlete('123')

    expect(await cache.get('athlete:123')).toBeUndefined()
    expect(await cache.get('athlete:123:stats')).toBeUndefined()
    expect(await cache.get('event:456')).toBe('event')
  })

  it('clears all cached entries', async () => {
    await cache.set('k1', 'v1', 60)
    await cache.set('k2', 'v2', 60)
    await cache.set('k3', 'v3', 60)

    expect(await cache.size()).toBe(3)

    await invalidateCache.all()

    expect(await cache.size()).toBe(0)
  })
})
