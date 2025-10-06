// Simple in-memory rate limiter
// For production, use Redis or similar distributed cache

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

// Clean up old entries every hour
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap.entries()) {
    if (entry.resetAt < now) {
      rateLimitMap.delete(key)
    }
  }
}, 3600000) // 1 hour

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed within the time window
   */
  maxRequests: number
  /**
   * Time window in milliseconds
   */
  windowMs: number
  /**
   * Optional: Skip rate limiting for certain conditions
   */
  skip?: () => boolean
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

/**
 * Check if a request is within rate limit
 * 
 * @param identifier - Unique identifier for the client (IP, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  if (config.skip?.()) {
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      reset: Date.now() + config.windowMs,
    }
  }

  const now = Date.now()
  const entry = rateLimitMap.get(identifier)

  // No entry or entry expired
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetAt: now + config.windowMs,
    })

    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      reset: now + config.windowMs,
    }
  }

  // Entry exists and not expired
  if (entry.count < config.maxRequests) {
    entry.count++

    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - entry.count,
      reset: entry.resetAt,
    }
  }

  // Rate limit exceeded
  return {
    success: false,
    limit: config.maxRequests,
    remaining: 0,
    reset: entry.resetAt,
  }
}

/**
 * Get client identifier from request
 * Prefers user ID, falls back to IP address
 */
export function getClientIdentifier(req: Request): string {
  // Try to get from custom header (set by proxy/load balancer)
  const forwarded = req.headers.get("x-forwarded-for")
  const realIp = req.headers.get("x-real-ip")
  
  // Parse forwarded header (format: "client, proxy1, proxy2")
  const ip = forwarded?.split(",")[0]?.trim() || realIp || "unknown"
  
  return ip
}

/**
 * Common rate limit configurations
 */
export const RateLimits = {
  // Auth endpoints: 5 requests per 15 minutes
  auth: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
  },
  // API endpoints: 100 requests per minute
  api: {
    maxRequests: 100,
    windowMs: 60 * 1000,
  },
  // Strict endpoints: 10 requests per minute
  strict: {
    maxRequests: 10,
    windowMs: 60 * 1000,
  },
} as const
