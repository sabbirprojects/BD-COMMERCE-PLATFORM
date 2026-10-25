import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { randomUUID } from "crypto"

/**
 * GET /admin/content/homepage
 * Lists all homepage sections ordered by sort_order.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any

  const sections = await pg.raw(
    `SELECT * FROM homepage_section WHERE deleted_at IS NULL ORDER BY sort_order ASC`
  )

  return res.json({
    sections: sections.rows || [],
    count: sections.rows?.length || 0,
  })
}

/**
 * POST /admin/content/homepage
 * Adds or updates a homepage section with link integrity verification (FR-9.6 / AC-9.1).
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any
  const body = req.body as any

  const {
    id: existingId,
    section_type,
    title_en,
    title_bn,
    subtitle_en,
    subtitle_bn,
    config_json = {},
    sort_order = 0,
    is_active = true,
  } = body

  if (!section_type) {
    return res.status(400).json({ error: "Missing required field: section_type" })
  }

  // AC-9.1 & FR-9.6: Verify linked products/categories are valid and not deleted
  if (config_json?.product_id) {
    const prodRes = await pg.raw(
      `SELECT id, status FROM product WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [config_json.product_id]
    )
    if (!prodRes.rows || prodRes.rows.length === 0) {
      return res.status(422).json({
        error: `Cannot publish homepage section: Linked product "${config_json.product_id}" does not exist or has been deleted (AC-9.1 / FR-9.6).`,
      })
    }
  }

  if (Array.isArray(config_json?.product_ids)) {
    for (const pid of config_json.product_ids) {
      const prodRes = await pg.raw(
        `SELECT id, status FROM product WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
        [pid]
      )
      if (!prodRes.rows || prodRes.rows.length === 0) {
        return res.status(422).json({
          error: `Cannot publish homepage section: Linked product "${pid}" does not exist or has been deleted (AC-9.1 / FR-9.6).`,
        })
      }
    }
  }

  if (config_json?.category_id) {
    const catRes = await pg.raw(
      `SELECT id FROM product_category WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [config_json.category_id]
    )
    if (!catRes.rows || catRes.rows.length === 0) {
      return res.status(422).json({
        error: `Cannot publish homepage section: Linked category "${config_json.category_id}" does not exist or has been deleted (FR-9.6).`,
      })
    }
  }

  const id = existingId || `hsec_${randomUUID().replace(/-/g, "").slice(0, 24)}`

  if (existingId) {
    await pg.raw(
      `UPDATE homepage_section SET
        section_type = ?,
        title_en = ?,
        title_bn = ?,
        subtitle_en = ?,
        subtitle_bn = ?,
        config_json = ?,
        sort_order = ?,
        is_active = ?,
        updated_at = now()
      WHERE id = ?`,
      [
        section_type,
        title_en || null,
        title_bn || null,
        subtitle_en || null,
        subtitle_bn || null,
        JSON.stringify(config_json),
        sort_order,
        is_active,
        id,
      ]
    )
  } else {
    await pg.raw(
      `INSERT INTO homepage_section (
        id, section_type, title_en, title_bn, subtitle_en, subtitle_bn,
        config_json, sort_order, is_active, published_at, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, now(), now(), now()
      )`,
      [
        id,
        section_type,
        title_en || null,
        title_bn || null,
        subtitle_en || null,
        subtitle_bn || null,
        JSON.stringify(config_json),
        sort_order,
        is_active,
      ]
    )
  }

  const saved = await pg.raw(`SELECT * FROM homepage_section WHERE id = ?`, [id])

  return res.json({
    success: true,
    section: saved.rows[0],
  })
}

/**
 * PUT /admin/content/homepage
 * Batch reorders homepage sections.
 */
export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any
  const { sections } = req.body as any

  if (!Array.isArray(sections)) {
    return res.status(400).json({ error: "Expected an array of section order objects." })
  }

  for (const item of sections) {
    if (item.id !== undefined && item.sort_order !== undefined) {
      await pg.raw(
        `UPDATE homepage_section SET sort_order = ?, is_active = COALESCE(?, is_active), updated_at = now() WHERE id = ?`,
        [item.sort_order, item.is_active, item.id]
      )
    }
  }

  const updated = await pg.raw(
    `SELECT * FROM homepage_section WHERE deleted_at IS NULL ORDER BY sort_order ASC`
  )

  return res.json({
    success: true,
    message: "Homepage sections reordered successfully.",
    sections: updated.rows || [],
  })
}
