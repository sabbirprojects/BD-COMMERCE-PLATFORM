import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /store/landing-pages
 * Returns all active, published landing pages for navigation/sitemap.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any

  const result = await pg.raw(
    `SELECT id, slug, title_en, title_bn, canonical_url, updated_at
     FROM landing_page
     WHERE status = 'published' AND deleted_at IS NULL
       AND (starts_at IS NULL OR starts_at <= now())
       AND (ends_at IS NULL OR ends_at >= now())
     ORDER BY updated_at DESC`
  )

  return res.json({
    landing_pages: result.rows || [],
  })
}
