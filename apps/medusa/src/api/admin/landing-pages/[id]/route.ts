import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { validateSectionsJson, validateThemeTokens } from "../../../../lib/content-validation"

/**
 * GET /admin/landing-pages/[id]
 * Returns landing page with versions and offers.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any
  const { id } = req.params

  const pageRes = await pg.raw(
    `SELECT * FROM landing_page WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
    [id]
  )

  if (!pageRes.rows || pageRes.rows.length === 0) {
    return res.status(404).json({ error: "Landing page not found" })
  }

  const versionsRes = await pg.raw(
    `SELECT id, version, is_current, published_at, published_by, created_at
     FROM landing_page_version
     WHERE landing_page_id = ? AND deleted_at IS NULL
     ORDER BY version DESC`,
    [id]
  )

  const offersRes = await pg.raw(
    `SELECT lpo.*, pv.title as variant_title, p.title as product_title
     FROM landing_page_offer lpo
     LEFT JOIN product_variant pv ON pv.id = lpo.variant_id
     LEFT JOIN product p ON p.id = pv.product_id
     WHERE lpo.landing_page_id = ? AND lpo.deleted_at IS NULL
     ORDER BY lpo.sort_order ASC`,
    [id]
  )

  return res.json({
    landing_page: pageRes.rows[0],
    versions: versionsRes.rows || [],
    offers: offersRes.rows || [],
  })
}

/**
 * PUT /admin/landing-pages/[id]
 * Updates landing page draft.
 */
export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any
  const { id } = req.params
  const body = req.body as any

  const pageRes = await pg.raw(
    `SELECT * FROM landing_page WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
    [id]
  )
  if (!pageRes.rows || pageRes.rows.length === 0) {
    return res.status(404).json({ error: "Landing page not found" })
  }

  const existing = pageRes.rows[0]

  // Validate sections if provided
  if (body.sections_json) {
    const sectionsValidation = validateSectionsJson(body.sections_json)
    if (!sectionsValidation.valid) {
      return res.status(400).json({ error: sectionsValidation.error })
    }
  }

  // Validate theme tokens & contrast if provided
  if (body.theme_tokens_json) {
    const themeValidation = validateThemeTokens(body.theme_tokens_json)
    if (!themeValidation.valid) {
      return res.status(400).json({ error: themeValidation.error })
    }
  }

  const updatedSections = body.sections_json !== undefined ? JSON.stringify(body.sections_json) : existing.sections_json
  const updatedTheme = body.theme_tokens_json !== undefined ? JSON.stringify(body.theme_tokens_json) : existing.theme_tokens_json

  await pg.raw(
    `UPDATE landing_page SET
      title_en = COALESCE(?, title_en),
      title_bn = COALESCE(?, title_bn),
      checkout_mode = COALESCE(?, checkout_mode),
      default_locale = COALESCE(?, default_locale),
      canonical_url = COALESCE(?, canonical_url),
      seo_title_en = COALESCE(?, seo_title_en),
      seo_title_bn = COALESCE(?, seo_title_bn),
      seo_description_en = COALESCE(?, seo_description_en),
      seo_description_bn = COALESCE(?, seo_description_bn),
      sections_json = ?,
      theme_tokens_json = ?,
      ad_campaign_id = COALESCE(?, ad_campaign_id),
      starts_at = COALESCE(?, starts_at),
      ends_at = COALESCE(?, ends_at),
      updated_at = now()
    WHERE id = ?`,
    [
      body.title_en?.trim(),
      body.title_bn?.trim(),
      body.checkout_mode,
      body.default_locale,
      body.canonical_url,
      body.seo_title_en,
      body.seo_title_bn,
      body.seo_description_en,
      body.seo_description_bn,
      updatedSections,
      updatedTheme,
      body.ad_campaign_id,
      body.starts_at,
      body.ends_at,
      id,
    ]
  )

  const updated = await pg.raw(`SELECT * FROM landing_page WHERE id = ? LIMIT 1`, [id])

  return res.json({
    landing_page: updated.rows[0],
  })
}

/**
 * DELETE /admin/landing-pages/[id]
 * Soft-deletes a landing page.
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any
  const { id } = req.params

  await pg.raw(`UPDATE landing_page SET deleted_at = now() WHERE id = ?`, [id])
  return res.json({ success: true, message: "Landing page deleted" })
}
