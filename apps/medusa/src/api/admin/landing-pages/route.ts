import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { randomUUID } from "crypto"
import { validateSectionsJson, validateThemeTokens } from "../../../lib/content-validation"

/**
 * GET /admin/landing-pages
 * Returns list of campaign landing pages with version and offer counts.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any

  const result = await pg.raw(
    `SELECT 
      lp.*,
      (SELECT count(*)::int FROM landing_page_version lpv WHERE lpv.landing_page_id = lp.id AND lpv.deleted_at IS NULL) as versions_count,
      (SELECT count(*)::int FROM landing_page_offer lpo WHERE lpo.landing_page_id = lp.id AND lpo.deleted_at IS NULL) as offers_count
    FROM landing_page lp
    WHERE lp.deleted_at IS NULL
    ORDER BY lp.created_at DESC`
  )

  return res.json({
    landing_pages: result.rows || [],
    count: result.rows?.length || 0,
  })
}

/**
 * POST /admin/landing-pages
 * Creates a new draft landing page with validated sections and theme tokens.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any
  const body = req.body as any

  const {
    slug,
    title_en,
    title_bn,
    ad_campaign_id,
    checkout_mode = "embedded",
    default_locale = "bn",
    canonical_url,
    seo_title_en,
    seo_title_bn,
    seo_description_en,
    seo_description_bn,
    sections_json = [],
    theme_tokens_json,
    starts_at,
    ends_at,
  } = body

  if (!slug || !title_en) {
    return res.status(400).json({
      error: "Missing required fields: slug and title_en are mandatory.",
    })
  }

  // Validate sections JSON
  const sectionsValidation = validateSectionsJson(sections_json)
  if (!sectionsValidation.valid) {
    return res.status(400).json({ error: sectionsValidation.error })
  }

  // Validate theme tokens & contrast
  const themeValidation = validateThemeTokens(theme_tokens_json)
  if (!themeValidation.valid) {
    return res.status(400).json({ error: themeValidation.error })
  }

  // Check unique slug
  const existing = await pg.raw(
    `SELECT id FROM landing_page WHERE slug = ? AND deleted_at IS NULL LIMIT 1`,
    [slug.trim()]
  )
  if (existing.rows?.length > 0) {
    return res.status(400).json({
      error: `Landing page with slug "${slug}" already exists.`,
    })
  }

  const id = `lp_${randomUUID().replace(/-/g, "").slice(0, 24)}`

  await pg.raw(
    `INSERT INTO landing_page (
      id, slug, title_en, title_bn, status, ad_campaign_id,
      checkout_mode, default_locale, canonical_url,
      seo_title_en, seo_title_bn, seo_description_en, seo_description_bn,
      sections_json, theme_tokens_json, starts_at, ends_at,
      created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, 'draft', ?,
      ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      now(), now()
    )`,
    [
      id,
      slug.trim().toLowerCase(),
      title_en.trim(),
      title_bn ? title_bn.trim() : null,
      ad_campaign_id || null,
      checkout_mode,
      default_locale,
      canonical_url || null,
      seo_title_en || null,
      seo_title_bn || null,
      seo_description_en || null,
      seo_description_bn || null,
      JSON.stringify(sections_json),
      theme_tokens_json ? JSON.stringify(theme_tokens_json) : null,
      starts_at || null,
      ends_at || null,
    ]
  )

  const created = await pg.raw(
    `SELECT * FROM landing_page WHERE id = ? LIMIT 1`,
    [id]
  )

  return res.status(201).json({
    landing_page: created.rows[0],
  })
}
