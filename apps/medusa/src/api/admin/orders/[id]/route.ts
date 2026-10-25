import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /admin/orders/:id
 *
 * Implements Prompt 12: Order detail with independent statuses,
 * financial snapshots (with COGS), COD call logs, invoice, and SMS logs.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const { id } = req.params

  // 1. Fetch order & BD details
  const orderRes = await pg.raw(
    `SELECT 
      o.id as order_id,
      o.display_id,
      o.status as order_status,
      o.currency_code,
      o.created_at,
      obd.id as bd_details_id,
      obd.payment_method_code,
      obd.cod_status,
      obd.shipment_state,
      obd.delivery_zone_code,
      obd.division_code,
      obd.district_code,
      obd.thana_code,
      obd.address_snapshot,
      obd.cod_collectable_paisa,
      obd.customer_paid_delivery_paisa,
      (SELECT count(*) FROM cod_call_log ccl WHERE ccl.order_id = o.id AND ccl.deleted_at IS NULL) as call_attempts_count,
      (SELECT MAX(called_at) FROM cod_call_log ccl WHERE ccl.order_id = o.id AND ccl.deleted_at IS NULL) as last_call_attempt_at,
      obd.source_reference,
      obd.courier_provider,
      obd.courier_tracking_code,
      crp.risk_level,
      crp.orders_rto,
      crp.delivery_success_rate
    FROM "order" o
    JOIN order_bd_details obd ON obd.order_id = o.id
    LEFT JOIN customer_risk_profile crp ON (crp.phone_e164 = (obd.address_snapshot->>'phone') OR crp.phone_e164 = ('+88' || (obd.address_snapshot->>'phone')))
    WHERE (o.id = ? OR CAST(o.display_id AS TEXT) = ?)
      AND obd.deleted_at IS NULL
    LIMIT 1`,
    [id, id]
  )

  const row = orderRes.rows?.[0]
  if (!row) {
    return res.status(404).json({
      success: false,
      error: "Order not found",
    })
  }

  // 2. Fetch immutable line snapshots with COGS (CHK-ORD-03)
  const snapshotsRes = await pg.raw(
    `SELECT * FROM order_line_snapshot WHERE order_id = ? AND deleted_at IS NULL ORDER BY created_at ASC`,
    [row.order_id]
  )
  const lineSnapshots = snapshotsRes.rows || []

  // 3. Fetch return review if any (4th independent status)
  const returnRes = await pg.raw(
    `SELECT * FROM return_review WHERE order_id = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1`,
    [row.order_id]
  )
  const returnReview = returnRes.rows?.[0] || null

  // 4. Fetch invoice if issued
  const invoiceRes = await pg.raw(
    `SELECT * FROM invoice WHERE order_id = ? AND deleted_at IS NULL LIMIT 1`,
    [row.order_id]
  )
  const invoice = invoiceRes.rows?.[0] || null

  // 5. Fetch COD call logs
  const callLogsRes = await pg.raw(
    `SELECT * FROM cod_call_log WHERE order_id = ? ORDER BY attempt_no ASC`,
    [row.order_id]
  )

  // 6. Fetch SMS delivery details
  const smsRes = await pg.raw(
    `SELECT * FROM sms_delivery_detail WHERE order_id = ? ORDER BY created_at DESC`,
    [row.order_id]
  )

  // Derive independent payment_status
  let paymentStatus = "unpaid"
  if (row.payment_method_code !== "cod" || row.shipment_state === "delivered") {
    paymentStatus = "paid"
  }
  if (returnReview?.refund_status === "paid") {
    paymentStatus = "refunded"
  }

  return res.json({
    success: true,
    order: {
      id: row.order_id,
      display_id: row.display_id || row.order_id,
      created_at: row.created_at,
      currency_code: row.currency_code || "bdt",
      // 4 Independent Statuses
      statuses: {
        order_status: row.order_status,
        payment_status: paymentStatus,
        shipment_state: row.shipment_state,
        return_status: returnReview?.status || null,
      },
      // Financial Snapshot with COGS (PRD FR-6.4)
      financial_snapshot: {
        items: lineSnapshots.map((item: any) => ({
          id: item.id,
          sku: item.sku,
          title: item.title,
          variant_title: item.variant_title,
          quantity: item.quantity,
          unit_price_bdt: Number(item.unit_price_paisa) / 100,
          cogs_unit_bdt: Number(item.cogs_unit_paisa || 0) / 100,
          cogs_total_bdt: Number(item.cogs_total_paisa || 0) / 100,
          total_price_bdt: (Number(item.unit_price_paisa) * Number(item.quantity)) / 100,
        })),
        delivery_charge_bdt: Number(row.customer_paid_delivery_paisa || 0) / 100,
        cod_collectable_bdt: Number(row.cod_collectable_paisa || 0) / 100,
      },
      // COD details widget
      cod: {
        status: row.cod_status,
        call_attempts: row.call_attempts_count || 0,
        last_call_at: row.last_call_attempt_at,
        history: callLogsRes.rows || [],
      },
      // Delivery & Courier
      delivery: {
        zone_code: row.delivery_zone_code,
        division: row.division_code,
        district: row.district_code,
        thana: row.thana_code,
        address: row.address_snapshot || {},
        courier_provider: row.courier_provider,
        tracking_code: row.courier_tracking_code,
      },
      // Return details
      return: returnReview
        ? {
            id: returnReview.id,
            status: returnReview.status,
            return_type: returnReview.return_type,
            refund_status: returnReview.refund_status,
            condition: returnReview.condition,
            rejection_note: returnReview.rejection_note,
            reviewed_by: returnReview.reviewed_by,
          }
        : null,
      // Invoice
      invoice: invoice
        ? {
            id: invoice.id,
            invoice_number: invoice.invoice_number,
            fiscal_year: invoice.fiscal_year,
            issued_at: invoice.issued_at,
            snapshot_sha256: invoice.snapshot_sha256,
            voided_at: invoice.voided_at,
          }
        : null,
      // SMS delivery history
      sms_logs: smsRes.rows || [],
      customer_risk: {
        risk_tier: row.risk_level || "low",
        total_rto_orders: row.orders_rto || 0,
        delivery_success_rate: row.delivery_success_rate || 100,
      },
    },
  })
}
