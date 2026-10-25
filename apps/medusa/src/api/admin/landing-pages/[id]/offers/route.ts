import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { randomUUID } from "crypto"

/**
 * GET /admin/landing-pages/[id]/offers
 * Lists offers for the landing page.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any
  const { id } = req.params

  const offers = await pg.raw(
    `SELECT lpo.*, pv.title as variant_title, p.title as product_title
     FROM landing_page_offer lpo
     JOIN product_variant pv ON pv.id = lpo.variant_id
     JOIN product p ON p.id = pv.product_id
     WHERE lpo.landing_page_id = ? AND lpo.deleted_at IS NULL
     ORDER BY lpo.sort_order ASC`,
    [id]
  )

  return res.json({ offers: offers.rows || [] })
}

/**
 * POST /admin/landing-pages/[id]/offers
 * Creates or updates a campaign offer for the landing page.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any
  const { id } = req.params
  const body = req.body as any

  const {
    variant_id,
    offer_price_paisa,
    bundle_qty = 1,
    label_en,
    label_bn,
    starts_at,
    ends_at,
    is_active = true,
    max_orders,
    sort_order = 0,
  } = body

  if (!variant_id) {
    return res.status(400).json({ error: "Missing required field: variant_id" })
  }

  // Validate variant exists
  const variantRes = await pg.raw(
    `SELECT id FROM product_variant WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
    [variant_id]
  )
  if (!variantRes.rows || variantRes.rows.length === 0) {
    return res.status(404).json({ error: `Variant "${variant_id}" not found.` })
  }

  const offerId = `lpoffer_${randomUUID().replace(/-/g, "").slice(0, 24)}`

  // Upsert offer for (landing_page_id, variant_id)
  await pg.raw(
    `INSERT INTO landing_page_offer (
      id, landing_page_id, variant_id, offer_price_paisa, raw_offer_price_paisa,
      bundle_qty, label_en, label_bn, starts_at, ends_at,
      is_active, max_orders, sort_order, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, now(), now()
    )
    ON CONFLICT (landing_page_id, variant_id) WHERE deleted_at IS NULL
    DO UPDATE SET
      offer_price_paisa = EXCLUDED.offer_price_paisa,
      raw_offer_price_paisa = EXCLUDED.raw_offer_price_paisa,
      bundle_qty = EXCLUDED.bundle_qty,
      label_en = EXCLUDED.label_en,
      label_bn = EXCLUDED.label_bn,
      starts_at = EXCLUDED.starts_at,
      ends_at = EXCLUDED.ends_at,
      is_active = EXCLUDED.is_active,
      max_orders = EXCLUDED.max_orders,
      sort_order = EXCLUDED.sort_order,
      updated_at = now()`,
    [
      offerId,
      id,
      variant_id,
      offer_price_paisa || null,
      offer_price_paisa ? JSON.stringify({ value: String(offer_price_paisa), precision: 20 }) : null,
      bundle_qty,
      label_en || null,
      label_bn || null,
      starts_at || null,
      ends_at || null,
      is_active,
      max_orders || null,
      sort_order,
    ]
  )

  const saved = await pg.raw(
    `SELECT * FROM landing_page_offer WHERE landing_page_id = ? AND variant_id = ? AND deleted_at IS NULL LIMIT 1`,
    [id, variant_id]
  )

  return res.status(201).json({
    success: true,
    offer: saved.rows[0],
  })
}
