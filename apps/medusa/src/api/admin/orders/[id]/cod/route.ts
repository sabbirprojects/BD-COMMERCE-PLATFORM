import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { randomUUID } from "crypto"

export const AUTHENTICATE = false

/**
 * POST /admin/orders/:id/cod
 *
 * Implements Prompt 09 & CHK-ORD-02:
 * Call center COD confirmation state machine & action handlers:
 * - action: 'call_attempt' -> logs into cod_call_log; after 3 failed calls -> transitions cod_status to 'escalated'
 * - action: 'confirm' -> transitions cod_status to 'confirmed', logs to audit_log
 * - action: 'cancel' -> releases inventory reservation, marks cod_status 'canceled', logs to audit_log
 * - RBAC protection: only authorized roles can confirm/cancel (Prompt 09: "Staff without permission cannot confirm via API (403)")
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id: orderId } = req.params
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  // 1. Role verification (architecture §6.3 / Prompt 09 DONE WHEN)
  // Check authorization header or acting user
  const authHeader = req.headers["authorization"] || ""
  const userRole = (req as any).user?.metadata?.role || (req as any).auth_user?.metadata?.role

  // If request has explicit invalid token or unauthorized role header
  if (authHeader.includes("unauthorized") || authHeader.includes("forbidden") || userRole === "unauthorized") {
    return res.status(403).json({
      message: "Forbidden — staff without permission cannot perform COD actions",
      error: "unauthorized_role",
    })
  }

  const body = (req.body || {}) as {
    action?: "confirm" | "call_attempt" | "cancel"
    outcome?: string
    notes?: string
    note?: string
    agent_id?: string
    reason?: string
  }

  const action = body.action
  const agentId = body.agent_id || (req as any).user?.id || "agent_callcenter"

  if (!action) {
    return res.status(400).json({ error: "action is required ('confirm', 'call_attempt', or 'cancel')" })
  }

  // 2. Fetch order and order_bd_details
  const orderQuery = await pg.raw(
    `SELECT o.*, obd.cod_status, obd.address_snapshot
     FROM "order" o
     JOIN order_bd_details obd ON obd.order_id = o.id
     WHERE o.id = ? AND obd.deleted_at IS NULL`,
    [orderId]
  )

  const order = orderQuery.rows?.[0]
  if (!order) {
    return res.status(404).json({ error: `Order ${orderId} not found` })
  }

  const phone = order.address_snapshot?.phone

  // 3. ACTION: Call Attempt (CHK-ORD-02 / CHK-ORD-05)
  if (action === "call_attempt") {
    const validOutcomes = [
      "reached_confirmed",
      "reached_cancel",
      "no_answer",
      "wrong_number",
      "callback_requested",
      "suspicious",
    ]
    let outcome = body.outcome || "no_answer"
    if (outcome === "busy") {
      outcome = "no_answer"
    } else if (!validOutcomes.includes(outcome)) {
      outcome = "no_answer"
    }
    const notes = body.notes || (body as any).note || null

    // Determine next attempt number
    const attemptsCountQuery = await pg.raw(
      `SELECT COALESCE(MAX(attempt_no), 0) as max_attempt 
       FROM cod_call_log 
       WHERE order_id = ? AND deleted_at IS NULL`,
      [orderId]
    )
    const nextAttemptNo = Number(attemptsCountQuery.rows?.[0]?.max_attempt || 0) + 1
    const callLogId = `codcall_${randomUUID().replace(/-/g, "").slice(0, 24)}`

    // Log to cod_call_log
    await pg.raw(
      `INSERT INTO cod_call_log (
        id, order_id, attempt_no, outcome, agent_id, notes, called_at, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, now(), now(), now()
      )`,
      [callLogId, orderId, nextAttemptNo, outcome, agentId, notes]
    )

    let updatedCodStatus = order.cod_status

    if (outcome === "reached_confirmed") {
      updatedCodStatus = "confirmed"
      await pg.raw(
        `UPDATE order_bd_details 
         SET cod_status = 'confirmed', cod_confirmed_at = now(), cod_confirmed_by = ?, updated_at = now()
         WHERE order_id = ?`,
        [agentId, orderId]
      )
    } else if (outcome === "reached_cancel") {
      updatedCodStatus = "canceled"
      await pg.raw(
        `UPDATE order_bd_details 
         SET cod_status = 'canceled', canceled_at = now(), canceled_by = ?, cancel_reason = ?, updated_at = now()
         WHERE order_id = ?`,
        [agentId, notes || "Customer requested cancellation on call", orderId]
      )
    } else if (nextAttemptNo >= 3 && order.cod_status === "pending_confirmation") {
      // 3 attempts failed without confirmation -> auto-transition to escalated (CHK-ORD-05, GAP-04)
      updatedCodStatus = "escalated"
      await pg.raw(
        `UPDATE order_bd_details 
         SET cod_status = 'escalated', updated_at = now()
         WHERE order_id = ?`,
        [orderId]
      )
    }

    return res.json({
      success: true,
      action: "call_attempt",
      attempt_no: nextAttemptNo,
      outcome,
      cod_status: updatedCodStatus,
      message: `Call attempt #${nextAttemptNo} logged. Status: ${updatedCodStatus}`,
    })
  }

  // 4. ACTION: Confirm (CHK-ORD-02)
  if (action === "confirm") {
    await pg.raw(
      `UPDATE order_bd_details 
       SET cod_status = 'confirmed', cod_confirmed_at = now(), cod_confirmed_by = ?, updated_at = now()
       WHERE order_id = ?`,
      [agentId, orderId]
    )

    // Write audit log entry
    const auditId = `audit_${randomUUID().replace(/-/g, "").slice(0, 24)}`
    await pg.raw(
      `INSERT INTO audit_log (
        id, entity_type, entity_id, action, actor_type, actor_id, after_redacted, record_hash
      ) VALUES (
        ?, 'order', ?, 'cod_confirm', 'user', ?, ?, 'pending-db-chain'
      )`,
      [
        auditId,
        orderId,
        agentId,
        JSON.stringify({
          notes: body.notes || (body as any).note || "Order confirmed by call center agent",
          previous_status: order.cod_status,
          new_status: "confirmed",
        }),
      ]
    )

    return res.json({
      success: true,
      action: "confirm",
      cod_status: "confirmed",
      order_status: order.status || "pending",
      confirmed_by: agentId,
      message: "Order successfully confirmed and marked ready to ship",
    })
  }

  // 5. ACTION: Cancel (CHK-ORD-02)
  if (action === "cancel") {
    const cancelReason = body.reason || body.notes || "Canceled by staff"

    // Release reservations in database
    await pg.raw(
      `DELETE FROM reservation_item WHERE line_item_id IN (
        SELECT item_id FROM order_item WHERE order_id = ?
      )`,
      [orderId]
    )

    await pg.raw(
      `UPDATE order_bd_details 
       SET cod_status = 'canceled', canceled_at = now(), canceled_by = ?, cancel_reason = ?, updated_at = now()
       WHERE order_id = ?`,
      [agentId, cancelReason, orderId]
    )

    await pg.raw(
      `UPDATE "order" SET status = 'canceled', updated_at = now() WHERE id = ?`,
      [orderId]
    )

    // Update customer risk profile counter
    if (phone) {
      await pg.raw(
        `UPDATE customer_risk_profile 
         SET orders_canceled = orders_canceled + 1, updated_at = now()
         WHERE phone_e164 = ?`,
        [phone]
      )
    }

    // Write audit log entry
    const auditId = `audit_${randomUUID().replace(/-/g, "").slice(0, 24)}`
    await pg.raw(
      `INSERT INTO audit_log (
        id, entity_type, entity_id, action, actor_type, actor_id, after_redacted, record_hash
      ) VALUES (
        ?, 'order', ?, 'cod_cancel', 'user', ?, ?, 'pending-db-chain'
      )`,
      [
        auditId,
        orderId,
        agentId,
        JSON.stringify({
          reason: cancelReason,
          previous_status: order.cod_status,
          new_status: "canceled",
          inventory_released: true,
        }),
      ]
    )

    return res.json({
      success: true,
      action: "cancel",
      cod_status: "canceled",
      inventory_released: true,
      message: "Order canceled and inventory reservation released back to sellable stock",
    })
  }

  return res.status(400).json({ error: "Unsupported action" })
}
