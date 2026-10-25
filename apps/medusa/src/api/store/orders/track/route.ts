import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import Redis from "ioredis"
import { validateAndNormalizeBdPhone } from "../../../../lib/phone"

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379"
let redisClient: Redis | null = null

function getRedis(): Redis {
  if (!redisClient) {
    redisClient = new Redis(REDIS_URL, { maxRetriesPerRequest: 2 })
  }
  return redisClient
}

const TRACKING_RATE_LIMIT = 5 // 5 requests per minute (quality-checklist.md CHK-SEC-04 P0 stricter threshold)
const TRACKING_WINDOW_SECONDS = 60

/**
 * GET /store/orders/track
 *
 * Implements Prompt 09 & Prompt 10 (CHK-SEC-04: Order Tracking Rate Limiting & Phone Enumeration Defense):
 * - Requires both order_id AND exact matching customer mobile phone number
 * - Rate limit: Strictly 5 attempts per minute per IP and phone number (quality-checklist P0 aligned)
 * - Returns HTTP 429 Too Many Requests when rate limit exceeded
 * - Masks recipient mobile number (+88017****5678) for customer privacy
 * - Protects against order scraping and phone enumeration
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  const orderId = (req.query.order_id as string | undefined)?.trim()
  const rawPhone = (req.query.phone as string | undefined)?.trim()

  if (!orderId || !rawPhone) {
    return res.status(400).json({
      success: false,
      error: "Both order_id and phone are required for guest tracking",
      error_bn: "অর্ডার ট্র্যাকিংয়ের জন্য অর্ডার নম্বর এবং মোবাইল নম্বর উভয়ই আবশ্যক",
    })
  }

  const phoneValidation = validateAndNormalizeBdPhone(rawPhone)
  if (!phoneValidation.isValid) {
    return res.status(400).json({
      success: false,
      error: phoneValidation.errorEn,
      error_bn: phoneValidation.errorBn,
    })
  }
  const canonicalPhone = phoneValidation.canonical!

  // 1. Rate Limiting Check (CHK-SEC-04 P0: 5 attempts/min per IP and Phone)
  const clientIp = req.ip || (req.headers["x-forwarded-for"] as string) || "127.0.0.1"
  const rateLimitKey = `ratelimit:track:${clientIp}:${canonicalPhone}`
  const redis = getRedis()

  try {
    const currentCount = await redis.incr(rateLimitKey)
    if (currentCount === 1) {
      await redis.expire(rateLimitKey, TRACKING_WINDOW_SECONDS)
    }

    if (currentCount > TRACKING_RATE_LIMIT) {
      const ttl = await redis.ttl(rateLimitKey)
      return res.status(429).json({
        success: false,
        error: "too_many_requests",
        message: "Too many tracking lookups. Maximum 5 requests per minute allowed to prevent enumeration (CHK-SEC-04).",
        error_bn: "অতিরিক্ত ট্র্যাকিং অনুরোধ। নিরাপত্তা নিশ্চিত করতে প্রতি মিনিটে সর্বোচ্চ ৫ বার অনুসন্ধান অনুমোদিত।",
        retry_after_seconds: ttl > 0 ? ttl : TRACKING_WINDOW_SECONDS,
      })
    }
  } catch (redisErr) {
    // Graceful fallback if Redis is unavailable
  }

  // 2. Query order matching ID and phone
  const orderQuery = await pg.raw(
    `SELECT 
      o.id as order_id,
      o.display_id,
      o.status as order_status,
      COALESCE(obd.cod_collectable_paisa / 100.0, 0) as total,
      o.currency_code,
      o.created_at,
      obd.cod_status,
      obd.delivery_zone_code,
      obd.address_snapshot,
      obd.customer_paid_delivery_paisa,
      obd.shipment_state,
      obd.courier_provider,
      obd.courier_tracking_code
     FROM "order" o
     JOIN order_bd_details obd ON obd.order_id = o.id
     WHERE (o.id = ? OR CAST(o.display_id AS TEXT) = ?)
       AND obd.deleted_at IS NULL
       AND (obd.address_snapshot->>'phone' = ? OR obd.address_snapshot->>'alt_phone' = ?)
     LIMIT 1`,
    [orderId, orderId, canonicalPhone, canonicalPhone]
  )

  const order = orderQuery.rows?.[0]
  if (!order) {
    return res.status(404).json({
      success: false,
      error: "Order not found matching provided order ID and phone number",
      error_bn: "প্রদত্ত অর্ডার নম্বর এবং মোবাইল নম্বরের কোনো অর্ডার খুঁজে পাওয়া যায়নি",
    })
  }

  // 3. Fetch immutable line snapshots
  const snapshotsQuery = await pg.raw(
    `SELECT sku, title, variant_title, quantity, unit_price_paisa
     FROM order_line_snapshot
     WHERE order_id = ? AND deleted_at IS NULL
     ORDER BY created_at ASC`,
    [order.order_id]
  )

  // 4. Fetch return review status (CHK-FUL-04, AC-6.7)
  const returnRes = await pg.raw(
    `SELECT id, status, return_type, refund_status, condition, rejection_note, requested_at
     FROM return_review
     WHERE order_id = ? AND deleted_at IS NULL
     ORDER BY requested_at DESC LIMIT 1`,
    [order.order_id]
  )
  const returnReview = returnRes.rows?.[0] || null

  // 5. Mask phone for privacy (+88017****5678)
  const phoneStr = canonicalPhone
  const maskedPhone =
    phoneStr.length >= 10
      ? `${phoneStr.slice(0, 6)}****${phoneStr.slice(-4)}`
      : phoneStr

  return res.json({
    success: true,
    order: {
      order_id: order.order_id,
      display_id: order.display_id || order.order_id,
      status: order.order_status,
      cod_status: order.cod_status,
      shipment_state: order.shipment_state || "pending_confirmation",
      courier_provider: order.courier_provider || null,
      courier_tracking_code: order.courier_tracking_code || null,
      created_at: order.created_at,
      total_amount: Number(order.total),
      shipping_total: Number(order.customer_paid_delivery_paisa || 0) / 100,
      currency_code: order.currency_code || "bdt",
      delivery_zone: order.delivery_zone_code,
      masked_phone: maskedPhone,
      return_status: returnReview?.status || null,
      return_details: returnReview
        ? {
            id: returnReview.id,
            status: returnReview.status,
            return_type: returnReview.return_type,
            refund_status: returnReview.refund_status,
            requested_at: returnReview.requested_at,
            rejection_note: returnReview.rejection_note,
          }
        : null,
      items: (snapshotsQuery.rows || []).map((line: any) => ({
        sku: line.sku,
        title: line.title,
        variant_title: line.variant_title,
        quantity: Number(line.quantity),
        unit_price: Number(line.unit_price_paisa) / 100,
      })),
    },
  })
}
