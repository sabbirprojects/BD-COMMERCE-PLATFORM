import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { randomUUID } from "crypto"

/**
 * POST /admin/landing-pages/[id]/duplicate
 * Clones a landing page into a new draft with unique slug.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any
  const { id } = req.params

  const pageRes = await pg.raw(
    `SELECT * FROM landing_page WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
    [id]
  )
  if (!pageRes.rows || pageRes.rows.length === 0) {
    return res.status(404).json({ error: "Landing page not found" })
  }

  const orig = pageRes.rows[0]
  const newId = `lp_${randomUUID().replace(/-/g, "").slice(0, 24)}`
  const newSlug = `${orig.slug}-copy-${Date.now().toString(36)}`
  const newTitle = `${orig.title_en} (Copy)`

  await pg.raw(
    `INSERT INTO landing_page (
      id, slug, title_en, title_bn, status, ad_campaign_id,
      checkout_mode, default_locale, canonical_url,
      seo_title_en, seo_title_bn, seo_description_en, seo_description_bn,
      sections_json, theme_tokens_json,
      created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, 'draft', ?,
      ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?,
      now(), now()
    )`,
    [
      newId,
      newSlug,
      newTitle,
      orig.title_bn,
      orig.ad_campaign_id,
      orig.checkout_mode,
      orig.default_locale,
      orig.canonical_url,
      orig.seo_title_en,
      orig.seo_title_bn,
      orig.seo_description_en,
      orig.seo_description_bn,
      JSON.stringify(orig.sections_json),
      orig.theme_tokens_json ? JSON.stringify(orig.theme_tokens_json) : null,
    ]
  )

  const created = await pg.raw(`SELECT * FROM landing_page WHERE id = ?`, [newId])

  return res.status(201).json({
    success: true,
    message: "Landing page duplicated successfully.",
    landing_page: created.rows[0],
  })
}
