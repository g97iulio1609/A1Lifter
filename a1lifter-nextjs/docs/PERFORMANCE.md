# Performance Optimization Guide

## Overview

This document outlines performance optimization strategies and best practices for A1Lifter.

## Caching Strategy

### Memory Cache

We use an in-memory cache for development and single-instance deployments. For production with multiple instances, consider Redis or similar.

**Location**: `src/lib/cache.ts`

### Usage

```typescript
import { cache, cacheKeys, invalidateCache } from "@/lib/cache"

// Get from cache
const data = cache.get(cacheKeys.event("event-id"))

// Set cache with TTL (seconds)
cache.set(cacheKeys.event("event-id"), data, 600) // 10 minutes

// Delete from cache
cache.delete(cacheKeys.event("event-id"))

// Invalidate related cache entries
invalidateCache.event("event-id") // Clears event + leaderboard
```

### Cache with HOC

```typescript
import { withCache } from "@/lib/cache"

const getEventData = withCache(
  async (eventId: string) => {
    return await prisma.event.findUnique({ where: { id: eventId } })
  },
  {
    keyPrefix: "event",
    ttl: 600, // 10 minutes
    keyGenerator: (eventId) => eventId,
  }
)
```

### Cache Invalidation

Cache should be invalidated when data changes:

```typescript
// After updating an event
invalidateCache.event(eventId)

// After creating/updating attempt
invalidateCache.attempts(eventId)
invalidateCache.leaderboard(eventId)

// After updating athlete
invalidateCache.athlete(athleteId)
```

## Performance Profiling

### Profiler Class

Use the `Profiler` class to measure complex operations:

```typescript
import { Profiler } from "@/lib/performance"

async function complexOperation() {
  const profiler = new Profiler("complex-operation")

  profiler.mark("start")

  await step1()
  profiler.mark("step1-complete")
  profiler.measure("step1", "start", "step1-complete")

  await step2()
  profiler.mark("step2-complete")
  profiler.measure("step2", "step1-complete", "step2-complete")

  profiler.logSummary() // Logs all measurements with percentages
}
```

### Measure Time

Simple timing for single operations:

```typescript
import { measureTime } from "@/lib/performance"

const { result, duration } = await measureTime(
  () => expensiveOperation(),
  "expensive-operation"
)

console.log(`Operation took ${duration}ms`)
```

### Performance Budget

Set performance budgets to catch regressions:

```typescript
import { PerformanceBudget } from "@/lib/performance"

const budget = new PerformanceBudget(100, "api-call") // 100ms budget

await budget.check(async () => {
  return await fetch("/api/data")
})
// Logs warning if exceeded
```

## Database Optimization

### Indexes

All tables have appropriate indexes. Key indexes:

- **Events**: `organizerId`, `sport`, `status`, `startDate`, `isDeleted`
- **Attempts**: `userId`, `eventId`, `categoryId`, `result`, `status`, `timestamp`
- **Registrations**: `userId`, `eventId`, `categoryId`, `status`
- **Notifications**: `userId`, `isRead`, `createdAt`

### Query Optimization

1. **Use indexes in WHERE clauses**

   ```typescript
   // Good - uses index
   await prisma.attempt.findMany({
     where: { eventId, status: "QUEUED" },
   })

   // Avoid - no index on combinations
   await prisma.attempt.findMany({
     where: { notes: { contains: "text" } },
   })
   ```

2. **Select only needed fields**

   ```typescript
   // Good
   await prisma.user.findMany({
     select: { id: true, name: true, email: true },
   })

   // Avoid - fetches all fields
   await prisma.user.findMany()
   ```

3. **Batch queries with Promise.all**

   ```typescript
   const [users, events, attempts] = await Promise.all([
     prisma.user.count(),
     prisma.event.count(),
     prisma.attempt.count(),
   ])
   ```

4. **Use pagination for large datasets**
   ```typescript
   await prisma.event.findMany({
     take: 50,
     skip: page * 50,
     orderBy: { startDate: "desc" },
   })
   ```

## API Route Optimization

### 1. Add Caching

```typescript
export async function GET(request: Request) {
  const cacheKey = cacheKeys.eventList()
  const cached = cache.get(cacheKey)

  if (cached) {
    return NextResponse.json({ data: cached, cached: true })
  }

  const data = await fetchData()
  cache.set(cacheKey, data, 300) // 5 min TTL

  return NextResponse.json({ data, cached: false })
}
```

### 2. Add Profiling

```typescript
const profiler = new Profiler("api-route-name")

profiler.mark("start")
// ... operation
profiler.mark("complete")
profiler.measure("total", "start", "complete")
profiler.logSummary()
```

### 3. Set Appropriate Cache-Control Headers

```typescript
return NextResponse.json(data, {
  headers: {
    "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
  },
})
```

## Frontend Optimization

### React Query Configuration

Already configured in `src/hooks/api/` with:

- 5 minute stale time
- 10 minute cache time
- Automatic refetch on window focus
- Retry logic

### Image Optimization

Use Next.js Image component:

```tsx
import Image from "next/image"

<Image
  src="/path/to/image.jpg"
  alt="Description"
  width={800}
  height={600}
  priority={false} // true for above-the-fold
/>
```

### Code Splitting

Dynamic imports for large components:

```tsx
import dynamic from "next/dynamic"

const HeavyComponent = dynamic(() => import("./HeavyComponent"), {
  loading: () => <Spinner />,
  ssr: false, // disable SSR if not needed
})
```

## Performance Utilities

### Debounce

Limit function calls during rapid events:

```typescript
import { debounce } from "@/lib/performance"

const handleSearch = debounce((query: string) => {
  performSearch(query)
}, 300) // 300ms delay
```

### Throttle

Ensure function runs at most once per interval:

```typescript
import { throttle } from "@/lib/performance"

const handleScroll = throttle(() => {
  updateScrollPosition()
}, 100) // Max once per 100ms
```

### Memoize

Cache expensive computations:

```typescript
import { memoize } from "@/lib/performance"

const expensiveCalc = memoize(
  (input: number) => {
    // Heavy computation
    return result
  },
  { maxSize: 100 }
)
```

### Batch Processing

Process large arrays in batches:

```typescript
import { batchProcess } from "@/lib/performance"

const results = await batchProcess(
  largeArray,
  async (batch) => {
    return await processItems(batch)
  },
  50 // batch size
)
```

### Parallel with Limit

Execute promises with concurrency limit:

```typescript
import { parallelLimit } from "@/lib/performance"

const results = await parallelLimit(
  items,
  async (item) => await processItem(item),
  5 // max 5 concurrent
)
```

## Monitoring Performance

### Observability Integration

All performance utilities automatically send metrics to Sentry when configured:

- `recordTiming()` - Records operation duration
- `measureTime()` - Tracks function execution time
- `Profiler` - Detailed operation breakdown

### Logs

Performance logs are written with `logger.debug()`:

```
[Performance] database-query: 45.23ms
[Profiler/dashboard-stats] total: 123.45ms
```

### Performance Budget

Set budgets for critical operations:

```typescript
const budget = new PerformanceBudget(200, "critical-api")
await budget.check(() => criticalOperation())
// Warns if > 200ms
```

## Production Recommendations

1. **Enable Sentry** for error tracking and performance monitoring
2. **Use Redis** for cache in multi-instance deployments
3. **Enable CDN** for static assets and API responses
4. **Database Connection Pooling**: Already configured in Prisma
5. **Monitor Cache Hit Rates**: Check logs for cache effectiveness
6. **Set up Alerts**: Monitor API response times and error rates
7. **Regular Profiling**: Use profiler on slow endpoints

## Performance Checklist

- [ ] API routes have caching where appropriate
- [ ] Database queries use indexes
- [ ] Large datasets use pagination
- [ ] Images use Next.js Image component
- [ ] Heavy components use dynamic imports
- [ ] Search/filter inputs use debounce
- [ ] Scroll handlers use throttle
- [ ] Expensive calculations are memoized
- [ ] Performance budgets are set for critical paths
- [ ] Monitoring is configured in production

## Troubleshooting

### Slow API Responses

1. Check if caching is enabled
2. Use Profiler to identify bottlenecks
3. Review database query plans
4. Ensure indexes are being used

### High Memory Usage

1. Check cache size: `cache.size()`
2. Reduce cache TTL or max size
3. Clear cache periodically: `cache.clear()`

### Cache Invalidation Issues

1. Ensure invalidation happens on data mutations
2. Check cache key generation is consistent
3. Use `cache.deletePattern()` for related keys

## Further Reading

- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Prisma Performance](https://www.prisma.io/docs/guides/performance-and-optimization)
- [React Query Performance](https://tanstack.com/query/latest/docs/guides/performance)
