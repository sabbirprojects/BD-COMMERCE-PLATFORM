import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * POST /admin/landing-pages/[id]/rollback
 * Restores a prior published version snapshot (sections and theme tokens).
 * Invariant (AC-9.2): Rollback affects storefront appearance ONLY and never touches orders, payments, or stock.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
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

  // Find target version to restore
  let versionQuery = ""
  let queryParams: any[] = []

  if (body?.version_id) {
    versionQuery = `SELECT * FROM landing_page_version WHERE id = ? AND landing_page_id = ? AND deleted_at IS NULL LIMIT 1`
    queryParams = [body.version_id, id]
  } else if (body?.version) {
    versionQuery = `SELECT * FROM landing_page_version WHERE version = ? AND landing_page_id = ? AND deleted_at IS NULL LIMIT 1`
    queryParams = [body.version, id]
  } else {
    // Default to the latest version before current
    versionQuery = `SELECT * FROM landing_page_version WHERE landing_page_id = ? AND deleted_at IS NULL ORDER BY version DESC LIMIT 1`
    queryParams = [id]
  }

  const verRes = await pg.raw(versionQuery, queryParams)
  if (!verRes.rows || verRes.rows.length === 0) {
    return res.status(404).json({ error: "Target version not found for rollback." })
  }

  const targetVer = verRes.rows[0]

  // Update landing_page with target version's content
  await pg.raw(
    `UPDATE landing_page SET
      sections_json = ?,
      theme_tokens_json = ?,
      seo_title_en = COALESCE(?, seo_title_en),
      seo_title_bn = COALESCE(?, seo_title_bn),
      seo_description_en = COALESCE(?, seo_description_en),
      seo_description_bn = COALESCE(?, seo_description_bn),
      published_version_id = ?,
      updated_at = now()
    WHERE id = ?`,
    [
      JSON.stringify(targetVer.sections_json),
      targetVer.theme_tokens_json ? JSON.stringify(targetVer.theme_tokens_json) : null,
      targetVer.seo_title_en,
      targetVer.seo_title_bn,
      targetVer.seo_description_en,
      targetVer.seo_description_bn,
      targetVer.id,
      id,
    ]
  )

  // Set is_current flag on target version
  await pg.raw(`UPDATE landing_page_version SET is_current = false WHERE landing_page_id = ?`, [id])
  await pg.raw(`UPDATE landing_page_version SET is_current = true WHERE id = ?`, [targetVer.id])

  const updatedPage = await pg.raw(`SELECT * FROM landing_page WHERE id = ?`, [id])

  return res.json({
    success: true,
    message: `Landing page rolled back to version ${targetVer.version}. Orders and stock remain intact (AC-9.2).`,
    landing_page: updatedPage.rows[0],
    restored_version: targetVer,
  })
}
