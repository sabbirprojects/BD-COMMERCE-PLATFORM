import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { randomUUID } from "crypto"

/**
 * GET /admin/content/pages
 * Lists all policy / informational content pages.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any

  const pages = await pg.raw(
    `SELECT * FROM content_page WHERE deleted_at IS NULL ORDER BY updated_at DESC`
  )

  return res.json({
    pages: pages.rows || [],
    count: pages.rows?.length || 0,
  })
}

/**
 * POST /admin/content/pages
 * Creates a new content/policy page with draft state.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any
  const body = req.body as any

  const {
    slug,
    title_en,
    title_bn,
    body_en,
    body_bn,
    excerpt_en,
    excerpt_bn,
    page_type = "policy",
    status = "draft",
    seo_title_en,
    seo_title_bn,
    seo_description_en,
    seo_description_bn,
  } = body

  if (!slug || !title_en) {
    return res.status(400).json({ error: "Missing required fields: slug and title_en are mandatory." })
  }

  // Prevent script injection in HTML bodies
  if (/<script\b|javascript:/i.test(`${body_en || ""} ${body_bn || ""}`)) {
    return res.status(400).json({ error: "Script tags and javascript: URLs are prohibited in page bodies." })
  }

  const existing = await pg.raw(
    `SELECT id FROM content_page WHERE slug = ? AND deleted_at IS NULL LIMIT 1`,
    [slug.trim().toLowerCase()]
  )
  if (existing.rows && existing.rows.length > 0) {
    return res.status(400).json({ error: `Page with slug "${slug}" already exists.` })
  }

  const id = `page_${randomUUID().replace(/-/g, "").slice(0, 24)}`

  await pg.raw(
    `INSERT INTO content_page (
      id, slug, page_type, title_en, title_bn, body_en, body_bn,
      excerpt_en, excerpt_bn, status, seo_title_en, seo_title_bn,
      seo_description_en, seo_description_bn,
      published_at, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?,
      ?, now(), now()
    )`,
    [
      id,
      slug.trim().toLowerCase(),
      page_type,
      title_en.trim(),
      title_bn ? title_bn.trim() : null,
      body_en || null,
      body_bn || null,
      excerpt_en || null,
      excerpt_bn || null,
      status,
      seo_title_en || null,
      seo_title_bn || null,
      seo_description_en || null,
      seo_description_bn || null,
      status === "published" ? new Date() : null,
    ]
  )

  const created = await pg.raw(`SELECT * FROM content_page WHERE id = ?`, [id])

  return res.status(201).json({
    page: created.rows[0],
  })
}
