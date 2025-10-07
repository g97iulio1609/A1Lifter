# Performance Optimization Guide

## Overview

This guide consolidates the performance tooling that ships with A1Lifter. It explains how to configure the new distributed cache, serve static assets through a CDN, optimise database access, and execute repeatable load and stress tests.

---

## Caching Strategy

### Cache Providers

The cache layer now supports both in-memory and Redis-backed storage (`src/lib/cache.ts`). The active provider is exposed through `cacheProvider` and is selected automatically:

- **Memory cache** (default): ideal for local development and single-instance deployments.
- **Redis cache**: enabled when `REDIS_URL` (or `UPSTASH_REDIS_URL` / `REDIS_CONNECTION_URL`) is provided. Connections are namespaced via `REDIS_NAMESPACE` to avoid key collisions in shared clusters.

#### Environment variables

| Variable | Description |
| --- | --- |
| `REDIS_URL` | Standard connection string (`redis://` or `rediss://`). |
| `UPSTASH_REDIS_URL` | Alternative Upstash-compatible URL (falls back when `REDIS_URL` is undefined). |
| `REDIS_USERNAME` / `REDIS_USER` | Optional username when your provider requires it. |
| `REDIS_PASSWORD` | Optional password. |
| `REDIS_TLS` | Set to `true` to enforce TLS when the URL does not already start with `rediss://`. |
| `REDIS_TLS_REJECT_UNAUTHORIZED` | Set to `false` to accept self-signed certificates. |
| `REDIS_NAMESPACE` | Custom namespace prefix (defaults to `a1lifter`). |

Redis connections are initialised lazily and recover automatically from transient failures (see `src/lib/redis.ts`).

### Usage

```typescript
import { cache, cacheKeys, invalidateCache } from "@/lib/cache"

await cache.set(cacheKeys.event("event-id"), data, 600) // ttl in seconds
const data = await cache.get(cacheKeys.event("event-id"))
await cache.delete(cacheKeys.event("event-id"))
await invalidateCache.event("event-id")
```

`withCache` remains available for ergonomics when wrapping expensive asynchronous calls:

```typescript
import { withCache } from "@/lib/cache"

const getEventData = withCache(
  async (eventId: string) => {
    return prisma.event.findUnique({ where: { id: eventId } })
  },
  {
    keyPrefix: "event",
    ttl: 600,
    keyGenerator: (eventId) => eventId,
  }
)
```

The invalidation helpers return promises and should be awaited inside mutation workflows to guarantee eventual consistency when Redis is used.

`cacheProvider` exports the currently active backend so observability dashboards can annotate responses (e.g. `cacheProvider === 'redis'`).

---

## CDN & Static Asset Optimisation

`next.config.ts` now supports an optional CDN asset prefix. Configure the CDN edge URL and the framework automatically prefixes `_next` assets, registers remote image patterns, and emits long-lived caching headers.

```bash
# .env.production
NEXT_PUBLIC_CDN_URL=https://cdn.example.com/assets
```

Key improvements:

- Immutable caching for `/_next/static` assets (`max-age=31536000`).
- Aggressive caching for JS/CSS bundles and font/image assets with `stale-while-revalidate` hints.
- Image optimisation cache TTL increased to one hour and remote patterns generated from the CDN host.

When `NEXT_PUBLIC_CDN_URL` (or `CDN_URL`) is not defined, the application falls back to local asset serving without additional configuration.

---

## Database Optimisation

A new migration (`20251006234000_database_optimizations`) introduces targeted indexes to reduce contention during live events:

- **Users**: composite index on `(role, isActive)` accelerates admin dashboards.
- **Events**: `(status, startDate)` boosts schedule queries.
- **Event sessions**: `(eventId, order)` allows deterministic ordering without full scans.
- **Registrations**: `(eventId, status)` and `(eventId, categoryId)` optimise approval flows.
- **Attempts**: `(eventId, status, timestamp)` and `(eventId, result, lift)` speed up live scoring tables.
- **Judge assignments**: `(eventId, role)` supports staffing dashboards.
- **Records**: `(eventId, categoryId, lift)` improves record lookup.
- **Notifications**: `(userId, isRead, createdAt)` powers inbox pagination.

Follow the standard Prisma workflow to apply the migration:

```bash
npm run db:migrate:deploy
```

---

## Performance Profiling Utilities

Utilities in `src/lib/performance.ts` remain available:

- `Profiler` for multi-step instrumentation.
- `measureTime` for lightweight timing.
- `PerformanceBudget` to emit warnings when defined SLAs are exceeded.
- `memoize` for CPU-bound pure functions.

---

## Load & Stress Testing

A reusable load test harness lives at `scripts/performance/load-test.ts` (powered by `autocannon`).

### Running the suite

```bash
npm run perf:load
```

By default the runner targets `http://localhost:3000` with 50 concurrent connections for 30 seconds, followed by a stress phase at 1.5× concurrency.

### Customisation

| Variable | Default | Purpose |
| --- | --- | --- |
| `LOAD_TEST_BASE_URL` | `http://localhost:3000` | Target deployment. |
| `LOAD_TEST_CONNECTIONS` | `50` | Baseline concurrent connections. |
| `LOAD_TEST_DURATION` | `30` | Baseline duration (seconds). |
| `LOAD_TEST_COOKIE` | – | Raw cookie string for authenticated endpoints. |
| `LOAD_TEST_AUTHORIZATION` | – | Bearer/Basic header value. |
| `LOAD_TEST_SCENARIOS` | – | JSON array to override default endpoints. |

The default scenarios exercise the landing page, live leaderboard, health checks, and dashboard stats API. Results are printed as JSON for easy archival in observability systems.

---

## Best Practices

1. Prefer Redis in production or any multi-instance environment to guarantee cache coherence.
2. Monitor `cacheProvider` and Redis health metrics to catch failovers quickly.
3. Keep the CDN origin in sync with deployment hooks to avoid stale bundles.
4. Re-run the load test suite before every major release and capture the output in release notes.
5. Review `pg_stat_statements` periodically; new slow queries should prompt additional composite indexes following the patterns above.
