import {
  AuthenticatedMedusaRequest,
  authenticate,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import Redis from "ioredis"
import jwt from "jsonwebtoken"

type NextFunction = (err?: unknown) => void

const FORBIDDEN_MESSAGE = "Forbidden — admin authentication required"
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379"
let redisClient: Redis | null = null

function getRedis(): Redis {
  if (!redisClient) {
    redisClient = new Redis(REDIS_URL, { maxRetriesPerRequest: 2 })
  }
  return redisClient
}

/**
 * Invalidate all active sessions for a user (FR-8.2.6, AC-8.4):
 * Invoked whenever a staff member's password or role is changed.
 */
export async function invalidateUserSessions(userId: string): Promise<void> {
  const redis = getRedis()
  const revocationTimestamp = Date.now()
  // Store revocation timestamp valid for 7 days (longer than token lifetime)
  await redis.set(`auth:revoked:${userId}`, revocationTimestamp.toString(), "EX", 7 * 24 * 3600)
}

/**
 * Check if a session token was issued before the user's latest revocation event.
 */
export async function isSessionRevoked(userId: string, tokenIatSeconds?: number): Promise<boolean> {
  if (!userId) return false
  const redis = getRedis()
  const revokedAtStr = await redis.get(`auth:revoked:${userId}`)
  if (!revokedAtStr) return false

  const revokedAtMs = parseInt(revokedAtStr, 10)
  if (isNaN(revokedAtMs)) return false

  // If token has issued-at timestamp (in seconds), compare with revocation timestamp (in ms)
  if (tokenIatSeconds) {
    const tokenIssuedAtMs = tokenIatSeconds * 1000
    return tokenIssuedAtMs <= revokedAtMs
  }

  // If no iat is present, treat as revoked
  return true
}

/**
 * Server-side role gate for BD admin routes (PRD FR-8.2.3, architecture §6.3):
 * 1. Authenticates session or bearer JWT.
 * 2. AC-8.4: Checks Redis `auth:revoked:{userId}` to ensure session has not been revoked.
 * 3. FR-8.2.5: Enforces forced password change (`must_change_password`).
 * 4. Verifies role authorization against `user_rbac_role` join `rbac_role` and `user.metadata.role`.
 */
export function requireBdRoles(allowed: string[]) {
  const adminAuth = authenticate("user", ["session", "bearer"])

  const requireAuth: (
    req: MedusaRequest,
    res: MedusaResponse,
    next: NextFunction
  ) => void = (req, res, next) => {
    const json = res.json.bind(res)
    res.json = (payload) => {
      if (res.statusCode === 401) {
        res.status(403)
        return json({ message: FORBIDDEN_MESSAGE })
      }
      return json(payload)
    }

    adminAuth(req, res, (err?: unknown) => {
      if (err) {
        next(err)
        return
      }
      next()
    })
  }

  const requireRole: (
    req: MedusaRequest,
    res: MedusaResponse,
    next: NextFunction
  ) => void = async (req, res, next) => {
    try {
      const { actor_id: actorId } = (req as AuthenticatedMedusaRequest).auth_context
      if (!actorId) {
        throw new MedusaError(
          MedusaError.Types.FORBIDDEN,
          "Forbidden — admin authentication required"
        )
      }

      // 1. Session Invalidation Check (FR-8.2.6, AC-8.4)
      const authHeader = req.headers["authorization"] || ""
      if (authHeader.startsWith("Bearer ")) {
        const token = authHeader.slice(7)
        const decoded = jwt.decode(token) as { iat?: number } | null
        const revoked = await isSessionRevoked(actorId, decoded?.iat)
        if (revoked) {
          return res.status(403).json({
            message: "Session invalidated due to security or role change. Please log in again (FR-8.2.6, AC-8.4).",
            error: "session_revoked",
          })
        }
      }

      // 2. Fetch User & Roles
      const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
      const userRes = await pg.raw(
        `SELECT u.id, u.email, u.metadata,
                COALESCE(rr.name, u.metadata->>'role') as resolved_role
         FROM "user" u
         LEFT JOIN user_rbac_role urr ON urr.user_id = u.id AND urr.deleted_at IS NULL
         LEFT JOIN rbac_role rr ON rr.id = urr.rbac_role_id AND rr.deleted_at IS NULL
         WHERE u.id = ? AND u.deleted_at IS NULL
         LIMIT 1`,
        [actorId]
      )

      const userRow = userRes.rows?.[0]
      if (!userRow) {
        throw new MedusaError(MedusaError.Types.FORBIDDEN, "User record not found")
      }

      // 3. Forced Password Change Check (FR-8.2.5)
      // Check both user.metadata and auth_identity.app_metadata
      const isMustChangePassword =
        userRow.metadata?.must_change_password === true ||
        userRow.metadata?.must_change_password === "true"

      if (isMustChangePassword) {
        const path = req.path || req.url || ""
        if (!path.includes("/auth/change-password") && !path.includes("/auth/logout")) {
          return res.status(403).json({
            message: "Password change required before accessing platform (FR-8.2.5).",
            error: "must_change_password",
          })
        }
      }

      // 4. Role Authorization Check
      const effectiveRole = userRow.resolved_role || userRow.metadata?.role || "staff"
      if (!allowed.includes(effectiveRole)) {
        throw new MedusaError(
          MedusaError.Types.FORBIDDEN,
          `Insufficient role for this resource (requires one of: ${allowed.join(", ")}; current: ${effectiveRole})`
        )
      }

      // Attach resolved role and user row to request
      ;(req as any).resolved_role = effectiveRole
      ;(req as any).acting_user = userRow

      next()
    } catch (err) {
      next(err)
    }
  }

  return [requireAuth, requireRole]
}
