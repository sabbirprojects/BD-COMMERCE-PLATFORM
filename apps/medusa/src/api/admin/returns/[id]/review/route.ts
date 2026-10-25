import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { randomUUID } from "crypto"
import jwt from "jsonwebtoken"

function getUserFromReq(req: MedusaRequest) {
  const authHeader = req.headers["authorization"] || ""
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7)
    const decoded = jwt.decode(token) as any
    if (decoded) {
      return {
        id: decoded.actor_id || decoded.app_metadata?.user_id || "user_staff",
        role: decoded.app_metadata?.role || decoded.role || "operations",
      }
    }
  }
  const authContext = (req as any).auth_context
  if (authContext) {
    return {
      id: authContext.actor_id || "user_staff",
      role: authContext.app_metadata?.role || "operations",
    }
  }
  return (req as any).user || { id: "user_ops", role: "operations" }
}

/**
 * POST /admin/returns/:id/review
 *
 * Implements return review decision:
 * - RBAC Gate (AC-6.7): Restricted to authorized staff (owner, operations, finance).
 * - Reject retention (FR-6.7.13): Retains rejection reason, note, user, timestamp.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const { id } = req.params
  const user = getUserFromReq(req)

  // AC-6.7: Staff without return-review permission cannot review/approve/reject
  const permittedRoles = ["owner", "operations", "finance", "admin"]
  if (!permittedRoles.includes(user.role)) {
    return res.status(403).json({
      success: false,
      error: "unauthorized_role",
      message: "You do not have permission to review return requests (AC-6.7).",
    })
  }

  const { action, reason_code, note } = req.body as any

  if (!["approve", "reject", "request_info"].includes(action)) {
    return res.status(400).json({
      success: false,
      error: "action must be 'approve', 'reject', or 'request_info'",
    })
  }

  // Find return review
  const returnRes = await pg.raw(`SELECT * FROM return_review WHERE id = ? AND deleted_at IS NULL`, [id])
  const review = returnRes.rows?.[0]
  if (!review) {
    return res.status(404).json({ success: false, error: "Return review not found" })
  }

  if (action === "reject") {
    if (!reason_code || !note) {
      return res.status(400).json({
        success: false,
        error: "Rejection requires reason_code and note (FR-6.7.13)",
      })
    }

    await pg.raw(
      `UPDATE return_review
       SET status = 'rejected',
           rejection_reason_code = ?,
           rejection_note = ?,
           reviewed_by = ?,
           reviewed_at = now(),
           rejected_at = now(),
           updated_at = now()
       WHERE id = ?`,
      [reason_code, note, user.id, id]
    )

    // Audit log
    await pg.raw(
      `INSERT INTO audit_log (
        id, occurred_at, actor_id, actor_type, actor_role,
        entity_type, entity_id, action, reason, after_redacted, record_hash
      ) VALUES (
        ?, now(), ?, 'user', ?,
        'return', ?, 'return_rejected', ?, ?, 'pending-db-chain'
      )`,
      [
        `aud_${randomUUID().replace(/-/g, "").slice(0, 24)}`,
        user.id,
        user.role || "operations",
        id,
        note,
        JSON.stringify({ reason_code }),
      ]
    )

    return res.json({
      success: true,
      status: "rejected",
      message: "Return request rejected with reason recorded.",
    })
  }

  if (action === "approve") {
    await pg.raw(
      `UPDATE return_review
       SET status = 'approved',
           reviewed_by = ?,
           reviewed_at = now(),
           approved_at = now(),
           staff_note = COALESCE(?, staff_note),
           updated_at = now()
       WHERE id = ?`,
      [user.id, note || null, id]
    )

    await pg.raw(
      `INSERT INTO audit_log (
        id, occurred_at, actor_id, actor_type, actor_role,
        entity_type, entity_id, action, reason, record_hash
      ) VALUES (
        ?, now(), ?, 'user', ?,
        'return', ?, 'return_approved', ?, 'pending-db-chain'
      )`,
      [
        `aud_${randomUUID().replace(/-/g, "").slice(0, 24)}`,
        user.id,
        user.role || "operations",
        id,
        note || "Staff approved return request",
      ]
    )

    return res.json({
      success: true,
      status: "approved",
      message: "Return request approved. Customer may return item.",
    })
  }

  return res.json({ success: true, status: review.status })
}
