import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /store/content/homepage
 * Public storefront API to fetch active homepage sections in sort order.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any

  const sections = await pg.raw(
    `SELECT id, section_type, title_en, title_bn, subtitle_en, subtitle_bn, config_json, sort_order
     FROM homepage_section
     WHERE is_active = true AND deleted_at IS NULL
       AND (starts_at IS NULL OR starts_at <= now())
       AND (ends_at IS NULL OR ends_at >= now())
     ORDER BY sort_order ASC`
  )

  return res.json({
    sections: sections.rows || [],
    count: sections.rows?.length || 0,
  })
}
