import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /admin/content/pages/[id]
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any
  const { id } = req.params

  const page = await pg.raw(`SELECT * FROM content_page WHERE id = ? AND deleted_at IS NULL LIMIT 1`, [id])
  if (!page.rows || page.rows.length === 0) {
    return res.status(404).json({ error: "Page not found" })
  }

  return res.json({ page: page.rows[0] })
}

/**
 * PUT /admin/content/pages/[id]
 * Updates page content or handles publish/rollback.
 */
export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any
  const { id } = req.params
  const body = req.body as any

  const pageRes = await pg.raw(`SELECT * FROM content_page WHERE id = ? AND deleted_at IS NULL LIMIT 1`, [id])
  if (!pageRes.rows || pageRes.rows.length === 0) {
    return res.status(404).json({ error: "Page not found" })
  }

  const existing = pageRes.rows[0]

  // Handle Rollback action
  if (body.action === "rollback") {
    if (!existing.published_version_json) {
      return res.status(400).json({ error: "No previous published version found to restore." })
    }

    const prev = existing.published_version_json
    await pg.raw(
      `UPDATE content_page SET
        title_en = ?,
        title_bn = ?,
        body_en = ?,
        body_bn = ?,
        excerpt_en = ?,
        excerpt_bn = ?,
        status = 'published',
        updated_at = now()
      WHERE id = ?`,
      [
        prev.title_en,
        prev.title_bn,
        prev.body_en,
        prev.body_bn,
        prev.excerpt_en,
        prev.excerpt_bn,
        id,
      ]
    )

    const restored = await pg.raw(`SELECT * FROM content_page WHERE id = ?`, [id])
    return res.json({
      success: true,
      message: "Page restored to last published version successfully (AC-9.2).",
      page: restored.rows[0],
    })
  }

  // Handle Publish action
  if (body.action === "publish" || body.status === "published") {
    const versionSnapshot = {
      title_en: body.title_en || existing.title_en,
      title_bn: body.title_bn || existing.title_bn,
      body_en: body.body_en || existing.body_en,
      body_bn: body.body_bn || existing.body_bn,
      excerpt_en: body.excerpt_en || existing.excerpt_en,
      excerpt_bn: body.excerpt_bn || existing.excerpt_bn,
      published_at: new Date().toISOString(),
    }

    await pg.raw(
      `UPDATE content_page SET
        title_en = COALESCE(?, title_en),
        title_bn = COALESCE(?, title_bn),
        body_en = COALESCE(?, body_en),
        body_bn = COALESCE(?, body_bn),
        excerpt_en = COALESCE(?, excerpt_en),
        excerpt_bn = COALESCE(?, excerpt_bn),
        status = 'published',
        published_version_json = ?,
        published_at = now(),
        updated_at = now()
      WHERE id = ?`,
      [
        body.title_en,
        body.title_bn,
        body.body_en,
        body.body_bn,
        body.excerpt_en,
        body.excerpt_bn,
        JSON.stringify(versionSnapshot),
        id,
      ]
    )

    const published = await pg.raw(`SELECT * FROM content_page WHERE id = ?`, [id])
    return res.json({
      success: true,
      message: "Page published successfully.",
      page: published.rows[0],
    })
  }

  // Regular Update
  await pg.raw(
    `UPDATE content_page SET
      title_en = COALESCE(?, title_en),
      title_bn = COALESCE(?, title_bn),
      body_en = COALESCE(?, body_en),
      body_bn = COALESCE(?, body_bn),
      excerpt_en = COALESCE(?, excerpt_en),
      excerpt_bn = COALESCE(?, excerpt_bn),
      status = COALESCE(?, status),
      seo_title_en = COALESCE(?, seo_title_en),
      seo_title_bn = COALESCE(?, seo_title_bn),
      seo_description_en = COALESCE(?, seo_description_en),
      seo_description_bn = COALESCE(?, seo_description_bn),
      updated_at = now()
    WHERE id = ?`,
    [
      body.title_en,
      body.title_bn,
      body.body_en,
      body.body_bn,
      body.excerpt_en,
      body.excerpt_bn,
      body.status,
      body.seo_title_en,
      body.seo_title_bn,
      body.seo_description_en,
      body.seo_description_bn,
      id,
    ]
  )

  const updated = await pg.raw(`SELECT * FROM content_page WHERE id = ?`, [id])
  return res.json({
    success: true,
    page: updated.rows[0],
  })
}

/**
 * DELETE /admin/content/pages/[id]
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any
  const { id } = req.params

  await pg.raw(`UPDATE content_page SET deleted_at = now() WHERE id = ?`, [id])
  return res.json({ success: true, message: "Page deleted" })
}
