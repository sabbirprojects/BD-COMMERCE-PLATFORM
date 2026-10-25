import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { randomUUID } from "crypto"

export const AUTHENTICATE = false

/**
 * POST /admin/cod-queue/expire
 *
 * Implements Prompt 09 & CHK-ORD-05 (Scheduled COD Stock Reservation Expiry):
 * - Scans unconfirmed COD orders exceeding the configured expiry threshold (default 48h)
 * - Releases inventory reservations back to sellable stock
 * - Transitions order status to canceled and cod_status to expired
 * - Increments customer_risk_profile.orders_expired
 * - Writes audit_log entry for compliance and reporting
 * - Note: Cron workflow is DISABLED by default until O-03 sign-off, but fully implementable and manually triggerable via this endpoint.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  // 1. Find all expired unconfirmed orders
  const expiredQuery = await pg.raw(
    `SELECT obd.order_id, obd.address_snapshot->>'phone' as phone, obd.cod_expires_at
     FROM order_bd_details obd
     WHERE obd.cod_status IN ('pending_confirmation', 'escalated')
       AND obd.cod_expires_at IS NOT NULL
       AND obd.cod_expires_at <= now()
       AND obd.deleted_at IS NULL`
  )

  const expiredOrders = expiredQuery.rows || []
  const expiredOrderIds: string[] = []

  for (const row of expiredOrders) {
    const orderId = row.order_id
    expiredOrderIds.push(orderId)

    // Release reservations
    await pg.raw(
      `DELETE FROM reservation_item WHERE line_item_id IN (
        SELECT item_id FROM order_item WHERE order_id = ?
      )`,
      [orderId]
    )

    // Update order_bd_details
    await pg.raw(
      `UPDATE order_bd_details 
       SET cod_status = 'expired', canceled_at = now(), canceled_by = 'system_cron', cancel_reason = 'Automated COD 48-hour expiration', updated_at = now()
       WHERE order_id = ?`,
      [orderId]
    )

    // Update native order
    await pg.raw(
      `UPDATE "order" SET status = 'canceled', updated_at = now() WHERE id = ?`,
      [orderId]
    )

    // Increment orders_expired counter on risk profile
    if (row.phone) {
      await pg.raw(
        `UPDATE customer_risk_profile 
         SET orders_expired = orders_expired + 1, updated_at = now()
         WHERE phone_e164 = ?`,
        [row.phone]
      )
    }

    // Write audit log entry
    const auditId = `audit_${randomUUID().replace(/-/g, "").slice(0, 24)}`
    await pg.raw(
      `INSERT INTO audit_log (
        id, entity_type, entity_id, action, actor_type, actor_id, after_redacted, record_hash
      ) VALUES (
        ?, 'order', ?, 'cod_expire_cron', 'system', 'cron_cod_expiry', ?, 'pending-db-chain'
      )`,
      [
        auditId,
        orderId,
        JSON.stringify({
          cod_expires_at: row.cod_expires_at,
          action: "automated_cod_expiry",
          reservations_released: true,
        }),
      ]
    )
  }

  return res.json({
    success: true,
    expired_count: expiredOrderIds.length,
    expired_order_ids: expiredOrderIds,
    message: `Processed ${expiredOrderIds.length} expired COD order(s)`,
  })
}
