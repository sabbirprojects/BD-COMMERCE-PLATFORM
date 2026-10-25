import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { randomUUID } from "crypto"

/**
 * GET /admin/returns/policy
 * Fetches active return policy. Shows "not yet configured" if window_days is null (PRD FR-6.7.3).
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  const policyRes = await pg.raw(
    `SELECT * FROM return_policy WHERE is_active = true AND deleted_at IS NULL ORDER BY version DESC LIMIT 1`
  )
  const policy = policyRes.rows?.[0]

  if (!policy || policy.window_days === null) {
    return res.json({
      success: true,
      is_configured: false,
      message: "not yet configured",
      message_bn: "রিটার্ন পলিসি এখনও কনফিগার করা হয়নি",
      policy: policy || null,
    })
  }

  // Fetch scope overrides
  const scopeRes = await pg.raw(
    `SELECT * FROM return_policy_scope WHERE return_policy_id = ? AND deleted_at IS NULL`,
    [policy.id]
  )

  return res.json({
    success: true,
    is_configured: true,
    policy: {
      ...policy,
      scopes: scopeRes.rows || [],
    },
  })
}

/**
 * POST /admin/returns/policy
 * Updates or configures return policy (Owner only).
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const user = (req as any).user || { id: "user_owner", role: "owner" }

  if (user.role && user.role !== "owner") {
    return res.status(403).json({
      success: false,
      error: "Only owner can configure return policy (CHK-SEC-01)",
    })
  }

  const {
    name = "Standard 7-Day Return Policy",
    window_days,
    eligibility_note_en,
    eligibility_note_bn,
    return_shipping_paid_by = "merchant",
    refund_methods = ["bkash", "nagad", "bank"],
    allow_partial_return = true,
    requires_unboxing_video = false,
  } = req.body as any

  if (window_days !== undefined && window_days !== null && Number(window_days) <= 0) {
    return res.status(400).json({
      success: false,
      error: "window_days must be greater than 0 if provided",
    })
  }

  // Deactivate existing
  await pg.raw(`UPDATE return_policy SET is_active = false, updated_at = now() WHERE is_active = true`)

  const policyId = `retpol_${randomUUID().replace(/-/g, "").slice(0, 24)}`
  await pg.raw(
    `INSERT INTO return_policy (
      id, version, name, window_days, eligibility_note_en, eligibility_note_bn,
      return_shipping_paid_by, refund_methods, allow_partial_return,
      requires_unboxing_video, is_active, created_by, published_at, created_at, updated_at
    ) VALUES (
      ?, 1, ?, ?, ?, ?,
      ?, ?, ?,
      ?, true, ?, now(), now(), now()
    )`,
    [
      policyId,
      name,
      window_days !== undefined ? window_days : null,
      eligibility_note_en || "Eligible items may be returned within window.",
      eligibility_note_bn || "নির্দিষ্ট মেয়াদের মধ্যে পণ্য ফেরত দেওয়া যাবে।",
      return_shipping_paid_by,
      refund_methods,
      allow_partial_return,
      requires_unboxing_video,
      user.id,
    ]
  )

  return res.json({
    success: true,
    policy_id: policyId,
    is_configured: window_days !== null && window_days !== undefined,
    message: "Return policy updated successfully.",
  })
}

/**
 * DELETE /admin/returns/policy
 * AC-6.8 & PRD FR-6.7.2: Deleting a policy referenced by open returns requires explicit confirmation and is blocked.
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const body = (req.body || {}) as any
  const query = (req.query || {}) as any
  const policy_id = body.policy_id || query.policy_id || query.id
  const confirm_delete = body.confirm_delete === true || query.confirm_delete === "true"

  if (!policy_id) {
    return res.status(400).json({ success: false, error: "policy_id required" })
  }

  // Check if referenced by open returns
  const openReturnsRes = await pg.raw(
    `SELECT count(*) as count FROM return_review 
     WHERE policy_id = ? AND status NOT IN ('completed', 'canceled', 'rejected') AND deleted_at IS NULL`,
    [policy_id]
  )
  const openCount = Number(openReturnsRes.rows?.[0]?.count || 0)

  if (openCount > 0 && !confirm_delete) {
    return res.status(409).json({
      success: false,
      error: "policy_has_active_returns",
      open_returns_count: openCount,
      message: `Cannot delete policy. It is actively referenced by ${openCount} open return request(s). Explicit admin confirmation required (AC-6.8).`,
    })
  }

  await pg.raw(`UPDATE return_policy SET is_active = false, deleted_at = now() WHERE id = ?`, [policy_id])

  return res.json({
    success: true,
    message: "Policy deleted successfully.",
  })
}
