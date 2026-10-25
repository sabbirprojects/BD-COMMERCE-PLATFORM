import Redis from 'ioredis'

let redisClient: Redis | null = null

function getRedisClient(): Redis {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: false,
    })
  }
  return redisClient
}

export interface RateLimitResult {
  success: boolean
  current: number
  limit: number
  remaining: number
  resetSeconds: number
}

/**
 * Enforces rate limiting per IP (architecture.md §7.3).
 * Checkout Completion rate limit: 5 requests per minute per IP.
 * Key: `ratelimit:{ip}:checkout`
 * TTL: 60s
 */
export async function checkRateLimit(
  ip: string,
  endpoint: string = 'checkout',
  limit: number = 5,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  const redis = getRedisClient()
  const cleanIp = (ip || '127.0.0.1').trim().replace(/[^a-zA-Z0-9:._-]/g, '')
  const key = `ratelimit:${cleanIp}:${endpoint}`

  try {
    const pipeline = redis.pipeline()
    pipeline.incr(key)
    pipeline.ttl(key)
    const results = await pipeline.exec()

    if (!results || results.length < 2) {
      return { success: true, current: 1, limit, remaining: limit - 1, resetSeconds: windowSeconds }
    }

    const [incrErr, incrRes] = results[0]
    const [ttlErr, ttlRes] = results[1]

    if (incrErr) {
      console.error('[RateLimit] Redis incr error:', incrErr)
      return { success: true, current: 1, limit, remaining: limit - 1, resetSeconds: windowSeconds }
    }

    const current = Number(incrRes)
    let ttl = Number(ttlRes)

    // Set TTL if this is the first request in the window or TTL was lost
    if (ttl < 0) {
      await redis.expire(key, windowSeconds)
      ttl = windowSeconds
    }

    const remaining = Math.max(0, limit - current)
    const success = current <= limit

    return {
      success,
      current,
      limit,
      remaining,
      resetSeconds: ttl > 0 ? ttl : windowSeconds,
    }
  } catch (err) {
    console.error('[RateLimit] Redis error:', err)
    // Fallback safely if Redis fails so customers aren't hard-blocked by infra glitches
    return { success: true, current: 1, limit, remaining: limit - 1, resetSeconds: windowSeconds }
  }
}

/**
 * Extract client IP from Next.js request headers.
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0].trim()
    if (firstIp) return firstIp
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  return '127.0.0.1'
}
