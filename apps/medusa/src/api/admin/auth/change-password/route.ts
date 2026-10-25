import { MedusaRequest, MedusaResponse, AuthenticatedMedusaRequest } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { randomUUID, scryptSync, randomBytes } from "crypto"
import { invalidateUserSessions } from "../../../middleware-utils/bd-role-guard"

export const AUTHENTICATE = false

function hashPassword(password: string): string {
  const salt = randomBytes(16)
  const derivedKey = scryptSync(password, salt, 64)
  // Store formatted hash
  return `scrypt$${salt.toString("hex")}$${derivedKey.toString("hex")}`
}

/**
 * POST /admin/auth/change-password
 *
 * Implements Prompt 10 & FR-8.2.5, FR-8.2.6:
 * - Forced password change for new staff & voluntary password change
 * - Validates new password length (minimum 8 characters)
 * - Updates password hash in provider_identity
 * - Clears must_change_password in auth_identity.app_metadata and user.metadata
 * - Invalidates all active sessions in Redis (FR-8.2.6, AC-8.4)
 * - Appends audit_log entry
 * - Passwords are NEVER returned in response (AC-8.5)
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const actorId =
    (req as AuthenticatedMedusaRequest).auth_context?.actor_id ||
    (req as any).acting_user?.id

  if (!actorId) {
    return res.status(401).json({ message: "Authentication required" })
  }

  const { new_password, current_password } = (req.body || {}) as {
    new_password?: string
    current_password?: string
  }

  if (!new_password || typeof new_password !== "string" || new_password.length < 8) {
    return res.status(400).json({
      error: "invalid_password",
      message: "New password must be at least 8 characters long",
    })
  }

  // 1. Fetch user and auth identity
  const userRes = await pg.raw(`SELECT id, email, metadata FROM "user" WHERE id = ?`, [actorId])
  const user = userRes.rows?.[0]
  if (!user) {
    return res.status(404).json({ error: "User not found" })
  }

  // 2. Hash new password
  const newHash = hashPassword(new_password)

  // 3. Update provider_identity password
  await pg.raw(
    `UPDATE provider_identity 
     SET provider_metadata = jsonb_set(COALESCE(provider_metadata, '{}'::jsonb), '{password}', ?::jsonb),
         updated_at = now()
     WHERE entity_id = ? AND provider = 'emailpass'`,
    [JSON.stringify(newHash), user.email]
  )

  // 4. Clear must_change_password in user.metadata and auth_identity.app_metadata
  await pg.raw(
    `UPDATE "user" 
     SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{must_change_password}', 'false'::jsonb),
         updated_at = now()
     WHERE id = ?`,
    [actorId]
  )

  await pg.raw(
    `UPDATE auth_identity 
     SET app_metadata = jsonb_set(COALESCE(app_metadata, '{}'::jsonb), '{must_change_password}', 'false'::jsonb),
         updated_at = now()
     WHERE id IN (SELECT auth_identity_id FROM provider_identity WHERE entity_id = ?)`,
    [user.email]
  )

  // 5. Invalidate existing sessions in Redis (FR-8.2.6, AC-8.4)
  await invalidateUserSessions(actorId)

  // 6. Log security event to audit_log
  const auditId = `audit_${randomUUID().replace(/-/g, "").slice(0, 24)}`
  await pg.raw(
    `INSERT INTO audit_log (
      id, entity_type, entity_id, action, actor_type, actor_id, after_redacted, record_hash
    ) VALUES (
      ?, 'user', ?, 'password_change', 'user', ?, ?, 'pending-db-chain'
    )`,
    [
      auditId,
      actorId,
      actorId,
      JSON.stringify({
        event: "password_changed",
        must_change_password_cleared: true,
        sessions_invalidated: true,
      }),
    ]
  )

  return res.json({
    success: true,
    message: "Password updated successfully. Existing sessions have been invalidated.",
  })
}
