import Redis, { RedisOptions } from 'ioredis'
import { logger } from './logger'

type RedisClient = Redis

interface RedisGlobal {
  __redisClient?: RedisClient | null
}

const globalForRedis = globalThis as unknown as RedisGlobal

const redisUrl =
  process.env.REDIS_URL ||
  process.env.UPSTASH_REDIS_URL ||
  process.env.REDIS_CONNECTION_URL ||
  null

const redisNamespace = process.env.REDIS_NAMESPACE || 'a1lifter'

let connectPromise: Promise<void> | null = null

function createRedisOptions(url: string): RedisOptions {
  const options: RedisOptions = {
    lazyConnect: true,
    enableAutoPipelining: true,
    maxRetriesPerRequest: 2,
    reconnectOnError(error) {
      const targetErrors = ['READONLY', 'ETIMEDOUT', 'ECONNRESET']
      if (targetErrors.some((code) => error.message.includes(code))) {
        logger.warn('Redis reconnecting after error', { error: error.message })
        return true
      }
      return false
    },
  }

  const shouldEnableTls =
    process.env.REDIS_TLS === 'true' ||
    url.startsWith('rediss://') ||
    url.startsWith('redis+tls://')

  if (shouldEnableTls) {
    options.tls = {
      rejectUnauthorized: process.env.REDIS_TLS_REJECT_UNAUTHORIZED !== 'false',
    }
  }

  if (process.env.REDIS_USERNAME || process.env.REDIS_USER) {
    options.username = process.env.REDIS_USERNAME || process.env.REDIS_USER
  }

  if (process.env.REDIS_PASSWORD) {
    options.password = process.env.REDIS_PASSWORD
  }

  return options
}

function createRedisClient(url: string): RedisClient {
  const client = new Redis(url, createRedisOptions(url))

  client.on('connect', () => {
    logger.info('Redis connection established', {
      host: client.options.host,
      port: client.options.port,
      namespace: redisNamespace,
    })
  })

  client.on('error', (error) => {
    logger.error('Redis error', {
      error: error instanceof Error ? error.message : String(error),
    })
  })

  client.on('reconnecting', () => {
    logger.warn('Redis reconnecting')
  })

  client.on('end', () => {
    logger.warn('Redis connection closed')
    connectPromise = null
  })

  return client
}

export function getRedisClient(): RedisClient | null {
  if (!redisUrl) {
    return null
  }

  if (!globalForRedis.__redisClient) {
    globalForRedis.__redisClient = createRedisClient(redisUrl)
  }

  const client = globalForRedis.__redisClient

  if (client.status === 'end') {
    connectPromise = null
    client.connect().catch((error) => {
      logger.error('Redis reconnect failed', {
        error: error instanceof Error ? error.message : String(error),
      })
    })
  } else if (client.status === 'wait' && !connectPromise) {
    connectPromise = client
      .connect()
      .catch((error) => {
        logger.error('Redis initial connection failed', {
          error: error instanceof Error ? error.message : String(error),
        })
        connectPromise = null
      })
  }

  return client
}

export function getRedisNamespace() {
  return redisNamespace
}

export function isRedisEnabled() {
  return Boolean(redisUrl)
}

export async function disconnectRedis() {
  if (globalForRedis.__redisClient) {
    await globalForRedis.__redisClient.quit()
    globalForRedis.__redisClient = null
    connectPromise = null
  }
}
