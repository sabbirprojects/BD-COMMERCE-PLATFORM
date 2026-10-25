import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /store/pixel
 * Exposes the single centrally-managed Meta Pixel configuration (D-21, PRD FR-5.3.1).
 * Per-page pixel IDs are strictly prohibited.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any

  const opsQuery = await pg.raw(
    `SELECT meta_pixel_id FROM operational_settings WHERE id = 'global' LIMIT 1`
  )

  const metaPixelId = opsQuery.rows?.[0]?.meta_pixel_id || null

  return res.json({
    meta_pixel_id: metaPixelId,
  })
}
