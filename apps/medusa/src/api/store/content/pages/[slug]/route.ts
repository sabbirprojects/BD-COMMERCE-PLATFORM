import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /store/content/pages/[slug]
 * Public storefront API to fetch published policy / content page.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any
  const { slug } = req.params

  const pageRes = await pg.raw(
    `SELECT id, slug, page_type, title_en, title_bn, body_en, body_bn,
            excerpt_en, excerpt_bn, seo_title_en, seo_title_bn,
            seo_description_en, seo_description_bn, canonical_url, published_at
     FROM content_page
     WHERE slug = ? AND status = 'published' AND deleted_at IS NULL
     LIMIT 1`,
    [slug.toLowerCase()]
  )

  if (!pageRes.rows || pageRes.rows.length === 0) {
    return res.status(404).json({
      error: "Page not found.",
      error_bn: "পেজটি খুঁজে পাওয়া যায়নি।",
    })
  }

  return res.json({
    page: pageRes.rows[0],
  })
}
