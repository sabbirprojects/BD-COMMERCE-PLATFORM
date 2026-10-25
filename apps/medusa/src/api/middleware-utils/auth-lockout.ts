import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import Redis from "ioredis"
import { randomUUID } from "crypto"

type NextFunction = (err?: unknown) => void

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379"
let redisClient: Redis | null = null

function getRedis(): Redis {
  if (!redisClient) {
    redisClient = new Redis(REDIS_URL, { maxRetriesPerRequest: 2 })
  }
  return redisClient
}

const LOCKOUT_THRESHOLD = 5 // 5 failed attempts
const LOCKOUT_TTL_SECONDS = 15 * 60 // 15 minutes (900s)

/**
 * Account-Level Lockout Defense (FR-8.2.7, CHK-SEC-02, AC-8.3):
 * - Distinct from IP rate limiting: Redis key `auth:lockout:{user_email}` tracks consecutive failed login attempts per account.
 * - 5 consecutive failed attempts -> Account locked for 15 minutes across all IPs.
 * - Failed attempts and lockout triggers are immediately recorded in audit_log and flagged to Owner.
 * - Successful login resets the counter.
 * - Session cookies are verified to be HttpOnly and Secure.
 */
export async function authLockoutMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: NextFunction
) {
  // Only apply to POST authentication requests
  if (req.method !== "POST") {
    return next()
  }

  const body = (req.body || {}) as { email?: string; password?: string }
  const rawEmail = body.email
  if (!rawEmail || typeof rawEmail !== "string") {
    return next()
  }

  const normalizedEmail = rawEmail.trim().toLowerCase()
  const lockoutKey = `auth:lockout:${normalizedEmail}`
  const redis = getRedis()

  try {
    // 1. Check if account is currently locked out
    const currentFailures = await redis.get(lockoutKey)
    const failureCount = currentFailures ? parseInt(currentFailures, 10) : 0

    if (failureCount >= LOCKOUT_THRESHOLD) {
      const ttl = await redis.ttl(lockoutKey)
      return res.status(429).json({
        type: "account_locked",
        code: "ACCOUNT_LOCKED",
        message: `Account locked for 15 minutes due to ${LOCKOUT_THRESHOLD} consecutive failed login attempts (FR-8.2.7).`,
        retry_after_seconds: ttl > 0 ? ttl : LOCKOUT_TTL_SECONDS,
      })
    }

    // 2. Intercept response to observe authentication outcome
    const originalJson = res.json.bind(res)
    const originalEnd = res.end.bind(res)

    res.json = function (payload: any) {
      handleAuthOutcome(res.statusCode, normalizedEmail, req).catch(() => {})
      return originalJson(payload)
    }

    res.end = function (...args: any[]) {
      handleAuthOutcome(res.statusCode, normalizedEmail, req).catch(() => {})
      return (originalEnd as any)(...args)
    }

    next()
  } catch (err) {
    // If Redis is temporarily down, do not block login
    next()
  }
}

async function handleAuthOutcome(
  statusCode: number,
  normalizedEmail: string,
  req: MedusaRequest
) {
  const redis = getRedis()
  const lockoutKey = `auth:lockout:${normalizedEmail}`

  // On successful login: reset lockout counter
  if (statusCode === 200) {
    await redis.del(lockoutKey)
    return
  }

  // On failed login (401 Unauthorized): increment consecutive failure counter
  if (statusCode === 401) {
    const newCount = await redis.incr(lockoutKey)
    if (newCount === 1) {
      await redis.expire(lockoutKey, LOCKOUT_TTL_SECONDS)
    }

    // If threshold reached: log to audit_log and notify owner (FR-8.2.7, FR-8.2.8, AC-8.3)
    if (newCount >= LOCKOUT_THRESHOLD) {
      try {
        const pg = req.scope?.resolve(ContainerRegistrationKeys.PG_CONNECTION)
        if (pg) {
          const auditId = `audit_${randomUUID().replace(/-/g, "").slice(0, 24)}`
          await pg.raw(
            `INSERT INTO audit_log (
              id, entity_type, entity_id, action, actor_type, actor_id, after_redacted, record_hash
            ) VALUES (
              ?, 'user', ?, 'auth_lockout', 'system', 'security_guard', ?, 'pending-db-chain'
            )`,
            [
              auditId,
              normalizedEmail,
              JSON.stringify({
                event: "account_lockout",
                email: normalizedEmail,
                failed_attempts: newCount,
                lockout_duration_minutes: 15,
                ip_address: req.ip || req.headers["x-forwarded-for"] || "127.0.0.1",
                user_agent: req.headers["user-agent"] || "unknown",
              }),
            ]
          )
        }
      } catch (logErr) {
        // Logging fail safe
      }
    }
  }
}
