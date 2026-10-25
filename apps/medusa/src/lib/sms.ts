import { randomUUID, createHash } from "crypto"

export interface SendSmsParams {
  orderId?: string
  eventType: string
  phone: string
  data: Record<string, string | number>
  locale?: "bn" | "en"
  pg: any
  simulateFailure?: boolean
}

export interface SmsResult {
  success: boolean
  sms_id: string
  status: "sent" | "delivered" | "failed"
  error?: string
}

/**
 * Format masked phone: +88017****5678
 */
export function maskPhone(phone: string): string {
  const clean = phone.replace(/[^\d+]/g, "")
  if (clean.length >= 11) {
    const start = clean.slice(0, 6)
    const end = clean.slice(-4)
    return `${start}****${end}`
  }
  return clean
}

/**
 * SHA-256 peppered hash for privacy-safe deduplication/reporting
 */
export function hashPhone(phone: string): string {
  const pepper = process.env.SMS_HASH_PEPPER || "bd_commerce_sms_pepper_2026"
  return createHash("sha256").update(`${phone}:${pepper}`).digest("hex")
}

/**
 * Dispatch SMS notification using stored template and mock adapter.
 * PRD FR-11.6.3: SMS failures NEVER roll back order/payment transactions.
 */
export async function sendSmsNotification(params: SendSmsParams): Promise<SmsResult> {
  const { orderId, eventType, phone, data, locale = "bn", pg, simulateFailure } = params

  const smsId = `smsdet_${randomUUID().replace(/-/g, "").slice(0, 24)}`
  const masked = maskPhone(phone)
  const hashed = hashPhone(phone)

  try {
    // 1. Fetch active SMS template
    const tplRes = await pg.raw(
      `SELECT * FROM sms_template 
       WHERE event_type = ? AND locale = ? AND is_active = true AND deleted_at IS NULL
       LIMIT 1`,
      [eventType, locale]
    )

    const template = tplRes.rows?.[0]
    let messageBody = ""

    if (template) {
      messageBody = template.body_template
      for (const [key, val] of Object.entries(data)) {
        messageBody = messageBody.replace(new RegExp(`\\{${key}\\}`, "g"), String(val))
        messageBody = messageBody.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), String(val))
      }
    } else {
      messageBody = `Notification for order ${data.order_no || orderId}: ${eventType}`
    }

    // 2. Simulated failure check (FR-11.6.3 test)
    if (simulateFailure) {
      throw new Error("SMS Gateway Connection Timeout: Gateway unreachable")
    }

    // 3. Record successful delivery log
    await pg.raw(
      `INSERT INTO sms_delivery_detail (
        id, notification_id, order_id, event_type, template_key,
        recipient_masked, recipient_hash, attempt_no, provider_code,
        status, sent_at, delivered_at, cost_paisa, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, 1, 'mock_bd_sms',
        'delivered', now(), now(), 35, now(), now()
      )`,
      [
        smsId,
        `notif_${randomUUID().replace(/-/g, "").slice(0, 24)}`,
        orderId || null,
        eventType,
        template?.template_key || null,
        masked,
        hashed,
      ]
    )

    return {
      success: true,
      sms_id: smsId,
      status: "delivered",
    }
  } catch (err: any) {
    // Log failure without throwing (FR-11.6.3: Non-blocking)
    const errRedacted = String(err.message || "Unknown SMS Gateway Error").slice(0, 255)

    await pg.raw(
      `INSERT INTO sms_delivery_detail (
        id, notification_id, order_id, event_type, template_key,
        recipient_masked, recipient_hash, attempt_no, provider_code,
        status, error_code, error_message_redacted, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, 1, 'mock_bd_sms',
        'failed', 'GATEWAY_ERROR', ?, now(), now()
      )`,
      [
        smsId,
        `notif_${randomUUID().replace(/-/g, "").slice(0, 24)}`,
        orderId || null,
        eventType,
        null,
        masked,
        hashed,
        errRedacted,
      ]
    )

    return {
      success: false,
      sms_id: smsId,
      status: "failed",
      error: errRedacted,
    }
  }
}
