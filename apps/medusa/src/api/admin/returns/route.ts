import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { randomUUID } from "crypto"

/**
 * GET /admin/returns
 * Lists return requests with review status and order details.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const { status, order_id } = req.query as Record<string, string>

  let sql = `
    SELECT rr.*, o.display_id, obd.address_snapshot->>'phone' as customer_phone,
           obd.payment_method_code, obd.shipment_state
    FROM return_review rr
    JOIN "order" o ON o.id = rr.order_id
    JOIN order_bd_details obd ON obd.order_id = rr.order_id
    WHERE rr.deleted_at IS NULL
  `
  const bindings: any[] = []

  if (status) {
    sql += ` AND rr.status = ?`
    bindings.push(status)
  }

  if (order_id) {
    sql += ` AND rr.order_id = ?`
    bindings.push(order_id)
  }

  sql += ` ORDER BY rr.requested_at DESC`
  const returnsRes = await pg.raw(sql, bindings)

  return res.json({
    success: true,
    returns: returnsRes.rows || [],
  })
}

/**
 * POST /admin/returns
 *
 * Implements return request creation:
 * - Policy Gate (PRD FR-6.7.3): Blocked if policy is unconfigured.
 * - Shipped Order Cancellation Gate (AC-6.4): Blocked if already shipped.
 * - Zero Auto-Approval (AC-6.5, AC-G7): Sits in pending_manual_review.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const user = (req as any).user || { id: "user_staff", role: "operations" }

  const body = (req.body || {}) as any
  const order_id = body.order_id
  const metadata = (body.metadata || {}) as Record<string, any>
  const return_type = body.return_type || metadata.return_type || "customer_return"
  const customer_note = body.customer_note || body.description || metadata.customer_note
  const staff_note = body.staff_note || body.internal_note || metadata.staff_note
  const is_cancel_request = Boolean(body.is_cancel_request || metadata.is_cancel_request || return_type === "customer_cancel")

  if (!order_id) {
    return res.status(400).json({ success: false, error: "order_id is required" })
  }

  // 1. Fetch Order and BD Details
  const orderRes = await pg.raw(
    `SELECT o.*, obd.shipment_state, obd.cod_status, obd.payment_method_code
     FROM "order" o
     JOIN order_bd_details obd ON obd.order_id = o.id
     WHERE o.id = ? AND obd.deleted_at IS NULL`,
    [order_id]
  )
  const order = orderRes.rows?.[0]
  if (!order) {
    return res.status(404).json({ success: false, error: "Order not found" })
  }

  // 2. Pre-Shipment Cancellation Check (AC-6.4 & PRD FR-6.7.15)
  if (is_cancel_request || return_type === "customer_cancel") {
    if (["dispatched", "out_for_delivery"].includes(order.shipment_state)) {
      return res.status(400).json({
        success: false,
        error: "shipped_order_cancel_blocked",
        message: "Order has already shipped. Cancellation is blocked; order must be routed through RTO / failed delivery flow (AC-6.4).",
        message_bn: "অর্ডার ইতিমধ্যে কুরিয়ারে প্রেরণ করা হয়েছে। এখন সরাসরি বাতিল সম্ভব নয়; আরটিও (RTO) প্রক্রিয়ার মাধ্যমে পরিচালনা করতে হবে।",
      })
    }
  }

  // 3. Return Policy Gate (PRD FR-6.7.3 & Done When)
  const policyRes = await pg.raw(
    `SELECT * FROM return_policy WHERE is_active = true AND deleted_at IS NULL ORDER BY version DESC LIMIT 1`
  )
  const policy = policyRes.rows?.[0]

  if (!policy || policy.window_days === null) {
    return res.status(400).json({
      success: false,
      error: "policy_unconfigured",
      message: "Return policy is not yet configured. Please configure policy in Admin Settings before initiating returns.",
      message_bn: "রিটার্ন পলিসি এখনও কনফিগার করা হয়নি। অনুগ্রহ করে অ্যাডমিন সেটিংসে পলিসি নির্ধারণ করুন।",
    })
  }

  // 4. Create 1:1 Return Review (AC-6.5: Pending Manual Review, NEVER auto-approved)
  const returnReviewId = `retrev_${randomUUID().replace(/-/g, "").slice(0, 24)}`
  const nativeReturnId = `ret_${randomUUID().replace(/-/g, "").slice(0, 24)}`

  const policySnapshot = {
    policy_id: policy.id,
    version: policy.version,
    window_days: policy.window_days,
    return_shipping_paid_by: policy.return_shipping_paid_by,
    refund_methods: policy.refund_methods,
  }

  await pg.raw(
    `INSERT INTO return_review (
      id, return_id, order_id, return_type, status,
      policy_id, policy_snapshot, requested_at,
      staff_note, customer_visible_note, return_shipping_paid_by,
      refund_status, condition, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, 'pending_manual_review',
      ?, ?, now(),
      ?, ?, ?,
      ?, 'uninspected', now(), now()
    )`,
    [
      returnReviewId,
      nativeReturnId,
      order_id,
      return_type,
      policy.id,
      JSON.stringify(policySnapshot),
      staff_note || null,
      customer_note || null,
      policy.return_shipping_paid_by,
      order.payment_method_code === "cod" ? "not_applicable" : "pending",
    ]
  )

  return res.status(201).json({
    success: true,
    return_id: returnReviewId,
    order_id,
    status: "pending_manual_review",
    message: "Return request submitted into Pending Manual Review queue (never auto-approved).",
  })
}
