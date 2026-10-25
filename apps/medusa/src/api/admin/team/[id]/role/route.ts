import { MedusaRequest, MedusaResponse, AuthenticatedMedusaRequest } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { randomUUID } from "crypto"
import { invalidateUserSessions } from "../../../../middleware-utils/bd-role-guard"

export const AUTHENTICATE = false

/**
 * PATCH /admin/team/:id/role
 *
 * Implements Prompt 10 & FR-8.2.6, AC-8.4:
 * - Updates staff role assignment in user_rbac_role and user.metadata
 * - Immediately invalidates all active sessions for the affected user in Redis (AC-8.4)
 * - Logs the role change in audit_log
 */
export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  const { id: targetUserId } = req.params
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const actorId =
    (req as AuthenticatedMedusaRequest).auth_context?.actor_id ||
    (req as any).acting_user?.id ||
    "admin_owner"

  const { role } = (req.body || {}) as { role?: string }
  if (!role) {
    return res.status(400).json({ error: "role is required" })
  }

  const validRoles = ["owner", "manager", "finance", "warehouse", "call_center", "content", "staff"]
  if (!validRoles.includes(role)) {
    return res.status(400).json({
      error: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
    })
  }

  // 1. Check target user exists
  const targetUserRes = await pg.raw(`SELECT id, email, metadata FROM "user" WHERE id = ?`, [targetUserId])
  const targetUser = targetUserRes.rows?.[0]
  if (!targetUser) {
    return res.status(404).json({ error: `User ${targetUserId} not found` })
  }

  const previousRole = targetUser.metadata?.role || "staff"

  // 2. Update user_rbac_role link
  const newRoleId = `role_${role}`
  await pg.raw(
    `UPDATE user_rbac_role 
     SET rbac_role_id = ?, updated_at = now()
     WHERE user_id = ?`,
    [newRoleId, targetUserId]
  )

  // 3. Update user.metadata
  await pg.raw(
    `UPDATE "user" 
     SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{role}', ?::jsonb),
         updated_at = now()
     WHERE id = ?`,
    [JSON.stringify(role), targetUserId]
  )

  // 4. Invalidate sessions in Redis (FR-8.2.6, AC-8.4: role change kills existing session)
  await invalidateUserSessions(targetUserId)

  // 5. Log role change in audit_log
  const auditId = `audit_${randomUUID().replace(/-/g, "").slice(0, 24)}`
  await pg.raw(
    `INSERT INTO audit_log (
      id, entity_type, entity_id, action, actor_type, actor_id, after_redacted, record_hash
    ) VALUES (
      ?, 'user', ?, 'role_change', 'user', ?, ?, 'pending-db-chain'
    )`,
    [
      auditId,
      targetUserId,
      actorId,
      JSON.stringify({
        user_id: targetUserId,
        email: targetUser.email,
        previous_role: previousRole,
        new_role: role,
        sessions_invalidated: true,
      }),
    ]
  )

  return res.json({
    success: true,
    user_id: targetUserId,
    email: targetUser.email,
    previous_role: previousRole,
    new_role: role,
    sessions_invalidated: true,
    message: `Role updated to "${role}". Existing active sessions have been invalidated immediately (AC-8.4).`,
  })
}
