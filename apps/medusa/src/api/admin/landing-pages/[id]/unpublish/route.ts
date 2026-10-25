import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * POST /admin/landing-pages/[id]/unpublish
 * Sets landing page status to 'unpublished', safely removing it from the public storefront and sitemap.
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

  await pg.raw(
    `UPDATE landing_page SET status = 'unpublished', updated_at = now() WHERE id = ?`,
    [id]
  )

  const updated = await pg.raw(`SELECT * FROM landing_page WHERE id = ?`, [id])

  return res.json({
    success: true,
    message: "Landing page unpublished successfully. Excluded from public sitemap.",
    landing_page: updated.rows[0],
  })
}
