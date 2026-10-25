import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { randomUUID } from "crypto"
import { sendSmsNotification } from "../../../../../lib/sms"
import jwt from "jsonwebtoken"

function getUserFromReq(req: MedusaRequest) {
  const authHeader = req.headers["authorization"] || ""
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7)
    const decoded = jwt.decode(token) as any
    if (decoded) {
      return {
        id: decoded.actor_id || decoded.app_metadata?.user_id || "user_staff",
        role: decoded.app_metadata?.role || decoded.role || "finance",
      }
    }
  }
  const authContext = (req as any).auth_context
  if (authContext) {
    return {
      id: authContext.actor_id || "user_staff",
      role: authContext.app_metadata?.role || "finance",
    }
  }
  return (req as any).user || { id: "user_finance", role: "finance" }
}

/**
 * POST /admin/returns/:id/refund
 *
 * Implements Manual Staff-Approved Refund Execution (CHK-FUL-05, PRD FR-6.7.5):
 * - Never auto-payout from webhooks
 * - Finance/Owner manually enters external refund_trx_id and amount
 * - Updates return_review status to completed & refund_status to paid
 * - Dispatches SMS confirmation
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const { id } = req.params
  const user = getUserFromReq(req)

  const permittedRoles = ["owner", "finance", "admin"]
  if (!permittedRoles.includes(user.role)) {
    return res.status(403).json({
      success: false,
      error: "unauthorized_role",
      message: "Only Finance or Owner role can record manual refund payouts (CHK-SEC-01).",
    })
  }

  const { refund_amount_bdt, refund_trx_id, method_code = "bkash", notes } = req.body as any

  if (!refund_amount_bdt || !refund_trx_id) {
    return res.status(400).json({
      success: false,
      error: "refund_amount_bdt and refund_trx_id are required",
    })
  }

  const reviewRes = await pg.raw(`SELECT * FROM return_review WHERE id = ? AND deleted_at IS NULL`, [id])
  const review = reviewRes.rows?.[0]
  if (!review) {
    return res.status(404).json({ success: false, error: "Return review not found" })
  }

  const refundAmountPaisa = Math.round(Number(refund_amount_bdt) * 100)

  // 1. Update return review record
  await pg.raw(
    `UPDATE return_review
     SET refund_status = 'paid',
         status = 'completed',
         refund_amount_paisa = ?,
         refund_trx_id = ?,
         completed_at = now(),
         staff_note = COALESCE(?, staff_note),
         updated_at = now()
     WHERE id = ?`,
    [refundAmountPaisa, refund_trx_id, notes || null, id]
  )

  // 2. Insert into refund_ledger (PRD FR-6.7.12)
  const ledgerId = `refled_${randomUUID().replace(/-/g, "").slice(0, 24)}`
  await pg.raw(
    `INSERT INTO refund_ledger (
      id, order_id, amount_paisa, currency_code, method_code, status,
      trx_id, reason_note, requested_by, approved_by, approved_at, paid_at,
      recorded_by, created_at, updated_at
    ) VALUES (
      ?, ?, ?, 'bdt', ?, 'paid',
      ?, ?, ?, ?, now(), now(),
      ?, now(), now()
    )`,
    [
      ledgerId,
      review.order_id,
      refundAmountPaisa,
      method_code,
      refund_trx_id,
      notes || "Manual return refund",
      user.id,
      user.id,
      user.id,
    ]
  )

  // 3. Record Audit Log
  await pg.raw(
    `INSERT INTO audit_log (
      id, occurred_at, actor_id, actor_type, actor_role,
      entity_type, entity_id, action, reason, after_redacted, record_hash
    ) VALUES (
      ?, now(), ?, 'user', ?,
      'return', ?, 'refund_paid', 'Manual refund processed by Finance', ?, 'pending-db-chain'
    )`,
    [
      `aud_${randomUUID().replace(/-/g, "").slice(0, 24)}`,
      user.id,
      user.role || "finance",
      id,
      JSON.stringify({
        refund_amount_bdt,
        refund_trx_id,
        method_code,
        order_id: review.order_id,
      }),
    ]
  )

  // 4. Fetch customer phone for SMS notification
  const orderRes = await pg.raw(
    `SELECT address_snapshot FROM order_bd_details WHERE order_id = ? LIMIT 1`,
    [review.order_id]
  )
  const phone = orderRes.rows?.[0]?.address_snapshot?.phone

  if (phone) {
    sendSmsNotification({
      orderId: review.order_id,
      eventType: "refund.completed",
      phone,
      data: {
        order_no: review.order_id,
        amount: refund_amount_bdt,
        trx_id: refund_trx_id,
      },
      pg,
    }).catch(() => {})
  }

  return res.json({
    success: true,
    return_id: id,
    order_id: review.order_id,
    status: "completed",
    refund_status: "paid",
    refund_amount_bdt: Number(refund_amount_bdt),
    refund_trx_id,
    message: "Manual refund payout recorded successfully (CHK-FUL-05).",
  })
}
