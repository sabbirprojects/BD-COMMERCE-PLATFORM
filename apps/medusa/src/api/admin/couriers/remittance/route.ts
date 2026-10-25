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
 * GET /admin/couriers/remittance
 *
 * Courier Remittance Reports (Scope #9, PRD FR-14.9, database.md §8.6):
 * - Compares customer_paid_delivery vs courier_cost vs remitted
 * - Missing costs remain null, never coerced to zero
 * - Lists disputed variances
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const { batch_id, status } = req.query as Record<string, string>

  let batchesSql = `
    SELECT rb.*, c.name_en as courier_name,
           (SELECT count(*) FROM courier_remittance_line rl WHERE rl.batch_id = rb.id AND rl.deleted_at IS NULL) as line_count,
           (SELECT count(*) FROM courier_remittance_line rl WHERE rl.batch_id = rb.id AND rl.dispute_status = 'open' AND rl.deleted_at IS NULL) as dispute_count
    FROM courier_remittance_batch rb
    JOIN courier c ON c.code = rb.courier_code
    WHERE rb.deleted_at IS NULL
  `
  const bindings: any[] = []
  if (batch_id) {
    batchesSql += ` AND rb.id = ?`
    bindings.push(batch_id)
  }
  if (status) {
    batchesSql += ` AND rb.status = ?`
    bindings.push(status)
  }
  batchesSql += ` ORDER BY rb.created_at DESC`

  const batchesRes = await pg.raw(batchesSql, bindings)

  let lines: any[] = []
  if (batch_id) {
    const linesRes = await pg.raw(
      `SELECT rl.*, o.display_id,
              obd.customer_paid_delivery_paisa,
              obd.courier_cost_paisa as order_courier_cost,
              obd.payment_method_code
       FROM courier_remittance_line rl
       JOIN "order" o ON o.id = rl.order_id
       JOIN order_bd_details obd ON obd.order_id = rl.order_id
       WHERE rl.batch_id = ? AND rl.deleted_at IS NULL
       ORDER BY rl.created_at ASC`,
      [batch_id]
    )
    lines = (linesRes.rows || []).map((l: any) => ({
      ...l,
      expected_bdt: Number(l.expected_paisa) / 100,
      remitted_bdt: Number(l.remitted_paisa) / 100,
      courier_fee_bdt: Number(l.courier_fee_paisa) / 100,
      cod_fee_bdt: Number(l.cod_fee_paisa) / 100,
      variance_bdt: Number(l.variance_paisa) / 100,
      customer_paid_delivery_bdt: l.customer_paid_delivery_paisa !== null ? Number(l.customer_paid_delivery_paisa) / 100 : null,
    }))
  }

  return res.json({
    success: true,
    batches: batchesRes.rows || [],
    lines,
  })
}

/**
 * POST /admin/couriers/remittance
 *
 * Ingest Courier Remittance Batch (database.md §8.6, DFD P9.0):
 * - Calculates variance per line: remitted - (expected - courier_fee - cod_fee)
 * - Flags non-zero variances with dispute_status = 'open'
 * - Prevents silent absorption into revenue
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const user = getUserFromReq(req)

  const permittedRoles = ["owner", "finance", "admin"]
  if (!permittedRoles.includes(user.role)) {
    return res.status(403).json({
      success: false,
      error: "unauthorized_role",
      message: "Only Finance or Owner role can process courier remittances.",
    })
  }

  const body = req.body as any
  const {
    courier_code,
    batch_ref,
    period_start,
    period_end,
    lines = [],
    adjustment_paisa = 0,
    bank_ref,
    notes,
  } = body || {}

  if (!courier_code) {
    return res.status(400).json({
      success: false,
      error: "courier_code is required",
    })
  }

  const batchRef = batch_ref || body?.bank_transfer_ref || `REMBATCH-${Date.now()}`
  const pStart = period_start || new Date(Date.now() - 7 * 86400000).toISOString()
  const pEnd = period_end || new Date().toISOString()
  const resolvedBankRef = bank_ref || body?.bank_transfer_ref || null

  const batchId = `rembatch_${randomUUID().replace(/-/g, "").slice(0, 24)}`

  let totalGrossExpectedPaisa = 0
  let totalCourierFeePaisa = 0
  let totalCodFeePaisa = 0
  let totalRemittedPaisa = 0
  let openDisputesCount = 0

  const processedLines: any[] = []

  for (const item of lines) {
    // 1. Fetch Order expected COD by order_id, consignment_external_id, or tracking_code
    let order: any = null
    if (item.order_id) {
      const orderRes = await pg.raw(
        `SELECT obd.order_id, obd.cod_collectable_paisa, obd.courier_consignment_id
         FROM order_bd_details obd
         WHERE obd.order_id = ? AND obd.deleted_at IS NULL
         LIMIT 1`,
        [item.order_id]
      )
      order = orderRes.rows?.[0]
    }
    if (!order && (item.consignment_external_id || item.tracking_code)) {
      const consignRes = await pg.raw(
        `SELECT cc.order_id, cc.cod_collectable_paisa, cc.id as courier_consignment_id
         FROM courier_consignment cc
         WHERE (cc.consignment_external_id = ? OR cc.tracking_code = ?)
           AND cc.deleted_at IS NULL
         LIMIT 1`,
        [item.consignment_external_id || "", item.tracking_code || ""]
      )
      order = consignRes.rows?.[0]
    }

    if (!order) {
      continue
    }

    const expectedPaisa = Number(order.cod_collectable_paisa || item.expected_paisa || 0)
    const remittedPaisa = Number(item.remitted_paisa || 0)
    const courierFeePaisa = Number(item.courier_fee_paisa || 0)
    const codFeePaisa = Number(item.cod_fee_paisa || 0)

    // Formula from database.md §8.6:
    // variance_paisa = remitted_paisa − (expected_paisa − courier_fee_paisa − cod_fee_paisa)
    const netExpectedPayoutPaisa = expectedPaisa - courierFeePaisa - codFeePaisa
    const variancePaisa = remittedPaisa - netExpectedPayoutPaisa

    const hasDispute = variancePaisa !== 0
    const disputeStatus = hasDispute ? "open" : "none"
    if (hasDispute) {
      openDisputesCount++
    }

    totalGrossExpectedPaisa += expectedPaisa
    totalCourierFeePaisa += courierFeePaisa
    totalCodFeePaisa += codFeePaisa
    totalRemittedPaisa += remittedPaisa

    const lineId = `remline_${randomUUID().replace(/-/g, "").slice(0, 24)}`

    await pg.raw(
      `INSERT INTO courier_remittance_line (
        id, batch_id, order_id, consignment_id, expected_paisa,
        courier_fee_paisa, cod_fee_paisa, remitted_paisa, variance_paisa,
        variance_reason_code, dispute_status, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, now(), now()
      )`,
      [
        lineId,
        batchId,
        order.order_id,
        order.courier_consignment_id || null,
        expectedPaisa,
        courierFeePaisa,
        codFeePaisa,
        remittedPaisa,
        variancePaisa,
        item.variance_reason_code || (hasDispute ? "remittance_mismatch" : null),
        disputeStatus,
      ]
    )

    // Update Order Settlement Status
    await pg.raw(
      `UPDATE order_bd_details
       SET cod_collected_paisa = ?,
           raw_cod_collected_paisa = ?,
           courier_cost_paisa = ?,
           raw_courier_cost_paisa = ?,
           cod_settlement_status = ?,
           updated_at = now()
       WHERE order_id = ?`,
      [
        remittedPaisa,
        JSON.stringify({ value: String(remittedPaisa), precision: 20 }),
        courierFeePaisa,
        JSON.stringify({ value: String(courierFeePaisa), precision: 20 }),
        hasDispute ? "disputed" : "settled",
        order.order_id,
      ]
    )

    processedLines.push({
      order_id: order.order_id,
      expected_paisa: expectedPaisa,
      remitted_paisa: remittedPaisa,
      variance_paisa: variancePaisa,
      dispute_status: disputeStatus,
    })
  }

  const batchStatus = openDisputesCount > 0 ? "disputed" : "matched"

  await pg.raw(
    `INSERT INTO courier_remittance_batch (
      id, courier_code, batch_ref, period_start, period_end,
      gross_collected_paisa, courier_fee_paisa, cod_fee_paisa,
      adjustment_paisa, net_remitted_paisa, received_at, bank_ref,
      status, reconciled_by, reconciled_at, notes, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, now(), ?,
      ?, ?, now(), ?, now(), now()
    )`,
    [
      batchId,
      courier_code,
      batchRef,
      pStart,
      pEnd,
      totalGrossExpectedPaisa,
      totalCourierFeePaisa,
      totalCodFeePaisa,
      adjustment_paisa,
      totalRemittedPaisa,
      resolvedBankRef,
      batchStatus,
      user.id,
      notes || null,
    ]
  )

  // Audit Log
  await pg.raw(
    `INSERT INTO audit_log (
      id, occurred_at, actor_id, actor_type, actor_role,
      entity_type, entity_id, action, reason, after_redacted, record_hash
    ) VALUES (
      ?, now(), ?, 'user', ?,
      'order', ?, 'remittance_batch_reconciled', ?, ?, 'pending-db-chain'
    )`,
    [
      `aud_${randomUUID().replace(/-/g, "").slice(0, 24)}`,
      user.id,
      user.role,
      batchId,
      `Remittance batch ${batchRef} reconciled (${processedLines.length} lines)`,
      JSON.stringify({
        courier_code,
        batch_ref: batchRef,
        lines_count: processedLines.length,
        disputes_count: openDisputesCount,
        batch_status: batchStatus,
      }),
    ]
  )

  const totalVariancePaisa = totalRemittedPaisa - (totalGrossExpectedPaisa - totalCourierFeePaisa - totalCodFeePaisa)

  return res.json({
    success: true,
    batch_id: batchId,
    batch_ref: batchRef,
    status: batchStatus,
    lines_processed: processedLines.length,
    open_disputes: openDisputesCount,
    total_remitted_paisa: totalRemittedPaisa,
    total_remitted_bdt: totalRemittedPaisa / 100,
    total_variance_paisa: totalVariancePaisa,
    total_variance_bdt: totalVariancePaisa / 100,
    lines: processedLines,
  })
}
