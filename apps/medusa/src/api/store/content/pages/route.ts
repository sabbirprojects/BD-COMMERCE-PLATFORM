import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /store/content/pages
 * Returns all published content / policy pages for navigation/sitemap.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any

  const result = await pg.raw(
    `SELECT id, slug, page_type, title_en, title_bn, canonical_url, updated_at
     FROM content_page
     WHERE status = 'published' AND deleted_at IS NULL
     ORDER BY updated_at DESC`
  )

  return res.json({
    pages: result.rows || [],
  })
}
