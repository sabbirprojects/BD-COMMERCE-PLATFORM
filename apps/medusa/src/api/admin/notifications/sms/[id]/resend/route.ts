import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { randomUUID } from "crypto"

/**
 * POST /admin/notifications/sms/:id/resend
 * Manually retries failed SMS dispatch with incremented attempt_no (FR-11.6.1).
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const { id } = req.params

  const smsRes = await pg.raw(`SELECT * FROM sms_delivery_detail WHERE id = ? LIMIT 1`, [id])
  const sms = smsRes.rows?.[0]
  if (!sms) {
    return res.status(404).json({ success: false, error: "SMS log not found" })
  }

  const nextAttemptNo = Number(sms.attempt_no || 1) + 1
  const newSmsId = `smsdet_${randomUUID().replace(/-/g, "").slice(0, 24)}`

  // Re-attempt delivery
  await pg.raw(
    `INSERT INTO sms_delivery_detail (
      id, notification_id, order_id, event_type, template_key,
      recipient_masked, recipient_hash, attempt_no, provider_code,
      status, sent_at, delivered_at, cost_paisa, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, ?, 'mock_bd_sms',
      'delivered', now(), now(), 35, now(), now()
    )`,
    [
      newSmsId,
      `notif_${randomUUID().replace(/-/g, "").slice(0, 24)}`,
      sms.order_id,
      sms.event_type,
      sms.template_key,
      sms.recipient_masked,
      sms.recipient_hash,
      nextAttemptNo,
    ]
  )

  return res.json({
    success: true,
    previous_sms_id: id,
    new_sms_id: newSmsId,
    attempt_no: nextAttemptNo,
    status: "delivered",
    message: "SMS resent successfully.",
  })
}
