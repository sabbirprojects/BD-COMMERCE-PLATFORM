import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { randomUUID } from "crypto"

export const AUTHENTICATE = false

/**
 * POST /admin/payments/poll-pending
 *
 * Implements Prompt 11, DFD §4.1 (GAP-02 / DF-36):
 * Asynchronous background poller worker to recover dropped browser redirects for online payments.
 * Queries pending payment_attempt records older than 5 minutes (or configurable min_age_seconds),
 * verifies status with gateway API/mock, and idempotently captures completed orders or expires abandoned sessions.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  const body = (req.body || {}) as {
    min_age_seconds?: number
    expire_after_seconds?: number
    simulated_gateway_status?: Record<string, "Completed" | "Failed">
  }

  const minAgeSeconds = body.min_age_seconds ?? 300 // 5 minutes default
  const expireAfterSeconds = body.expire_after_seconds ?? 1800 // 30 minutes default
  const simulated = body.simulated_gateway_status || {}

  // 1. Fetch pending attempts
  const pendingRes = await pg.raw(
    `SELECT pa.*, c.completed_at as cart_completed_at
     FROM payment_attempt pa
     LEFT JOIN cart c ON c.id = pa.cart_id
     WHERE pa.gateway_status = 'pending'
       AND pa.deleted_at IS NULL
       AND pa.initiated_at <= now() - make_interval(secs => ?)
     ORDER BY pa.initiated_at ASC
     LIMIT 50`,
    [minAgeSeconds]
  )

  const pendingAttempts = pendingRes.rows || []
  const results = {
    polled: pendingAttempts.length,
    captured: 0,
    expired: 0,
    unchanged: 0,
    details: [] as Array<{
      attempt_id: string
      cart_id: string
      provider: string
      trx_id: string
      action_taken: string
    }>,
  }

  for (const att of pendingAttempts) {
    const trxId = att.gateway_transaction_id
    const providerStatus = simulated[trxId] || (att.metadata && att.metadata.simulated_result)

    // Check if an order already exists for this cart or transaction ID (Idempotency)
    const existingOrder = await pg.raw(
      `SELECT pa.order_id as id
       FROM payment_attempt pa
       WHERE (pa.gateway_transaction_id = ? OR pa.order_id = ?)
         AND pa.order_id IS NOT NULL
         AND pa.gateway_status = 'success'
         AND pa.deleted_at IS NULL
       LIMIT 1`,
      [trxId, att.order_id || ""]
    )

    if (existingOrder.rows?.length > 0) {
      // Already captured/fulfilled: update attempt status to match
      await pg.raw(
        `UPDATE payment_attempt
         SET gateway_status = 'success', completed_at = COALESCE(completed_at, now()), updated_at = now()
         WHERE id = ?`,
        [att.id]
      )
      results.captured++
      results.details.push({
        attempt_id: att.id,
        cart_id: att.cart_id,
        provider: att.provider_code,
        trx_id: trxId,
        action_taken: "already_completed_synced",
      })
      continue
    }

    if (providerStatus === "Completed") {
      // Gateway confirms transaction completed: trigger callback endpoint logic
      const callbackEndpoint = att.provider_code === "nagad" ? "/hooks/nagad/callback" : "/hooks/bkash/callback"
      try {
        const port = process.env.MEDUSA_PORT || 9000
        const cbRes = await fetch(`http://127.0.0.1:${port}${callbackEndpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payment_id: trxId,
            cart_id: att.cart_id,
            status: "success",
            trx_id: trxId,
          }),
        })

        if (cbRes.ok) {
          results.captured++
          results.details.push({
            attempt_id: att.id,
            cart_id: att.cart_id,
            provider: att.provider_code,
            trx_id: trxId,
            action_taken: "recovered_and_captured",
          })
        } else {
          results.unchanged++
          results.details.push({
            attempt_id: att.id,
            cart_id: att.cart_id,
            provider: att.provider_code,
            trx_id: trxId,
            action_taken: "callback_failed",
          })
        }
      } catch (err: any) {
        results.unchanged++
        results.details.push({
          attempt_id: att.id,
          cart_id: att.cart_id,
          provider: att.provider_code,
          trx_id: trxId,
          action_taken: `error: ${err.message}`,
        })
      }
    } else {
      // Check if past expiry window
      const ageSeconds = (Date.now() - new Date(att.initiated_at).getTime()) / 1000
      if (ageSeconds >= expireAfterSeconds || providerStatus === "Failed") {
        await pg.raw(
          `UPDATE payment_attempt
           SET gateway_status = 'expired',
               failure_code = 'timeout_abandoned',
               failure_reason_redacted = 'Browser redirect dropped and session expired at gateway',
               completed_at = now(),
               updated_at = now()
           WHERE id = ?`,
          [att.id]
        )
        results.expired++
        results.details.push({
          attempt_id: att.id,
          cart_id: att.cart_id,
          provider: att.provider_code,
          trx_id: trxId,
          action_taken: "marked_expired",
        })
      } else {
        results.unchanged++
        results.details.push({
          attempt_id: att.id,
          cart_id: att.cart_id,
          provider: att.provider_code,
          trx_id: trxId,
          action_taken: "still_pending_within_window",
        })
      }
    }
  }

  return res.json({
    success: true,
    ...results,
    polled_at: new Date().toISOString(),
  })
}
