import { getRedisClient, getRedisNamespace, isRedisEnabled } from '@/lib/redis'
import { logger } from '@/lib/logger'

async function flushNamespace() {
  if (!isRedisEnabled()) {
    logger.warn('Redis is not configured. Nothing to flush.')
    return
  }

  const client = getRedisClient()
  if (!client) {
    logger.error('Redis client could not be initialised.')
    process.exitCode = 1
    return
  }

  const namespace = getRedisNamespace()
  let cursor = '0'
  let deleted = 0

  do {
    const [nextCursor, keys] = await client.scan(cursor, 'MATCH', `${namespace}:*`, 'COUNT', 250)
    if (keys.length) {
      const pipeline = client.pipeline()
      keys.forEach((key) => pipeline.del(key))
      const results = await pipeline.exec()
      deleted += results?.length ?? 0
    }
    cursor = nextCursor
  } while (cursor !== '0')

  logger.info('Redis namespace flushed', { namespace, deleted })
}

flushNamespace().catch((error) => {
  logger.error('Failed to flush Redis namespace', {
    error: error instanceof Error ? error.message : String(error),
  })
  process.exitCode = 1
})
