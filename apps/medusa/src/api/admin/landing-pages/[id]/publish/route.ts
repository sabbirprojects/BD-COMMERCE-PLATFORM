import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { randomUUID } from "crypto"
import { validateSectionsJson, validateThemeTokens } from "../../../../../lib/content-validation"

/**
 * POST /admin/landing-pages/[id]/publish
 * Validates inventory availability & publish state (AC-5.2), creates version snapshot,
 * and sets landing page status to 'published'.
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

  const page = pageRes.rows[0]

  // 1. Validate sections & tokens
  const sectionsValidation = validateSectionsJson(page.sections_json)
  if (!sectionsValidation.valid) {
    return res.status(422).json({ error: sectionsValidation.error })
  }
  const themeValidation = validateThemeTokens(page.theme_tokens_json)
  if (!themeValidation.valid) {
    return res.status(422).json({ error: themeValidation.error })
  }

  // 2. AC-5.2: Collect all product / variant IDs linked in offers or sections
  const offersRes = await pg.raw(
    `SELECT variant_id FROM landing_page_offer WHERE landing_page_id = ? AND deleted_at IS NULL`,
    [id]
  )
  const linkedVariantIds: string[] = (offersRes.rows || []).map((r: any) => r.variant_id)

  // Also scan sections_json for variant_id or product_id references
  if (Array.isArray(page.sections_json)) {
    for (const section of page.sections_json) {
      if (section.variant_id && !linkedVariantIds.includes(section.variant_id)) {
        linkedVariantIds.push(section.variant_id)
      }
      if (Array.isArray(section.variant_ids)) {
        for (const vid of section.variant_ids) {
          if (!linkedVariantIds.includes(vid)) linkedVariantIds.push(vid)
        }
      }
    }
  }

  // 3. AC-5.2: Validate each linked variant is published and in-stock
  for (const variantId of linkedVariantIds) {
    const variantQuery = await pg.raw(
      `SELECT pv.id as variant_id, pv.title as variant_title, p.id as product_id, p.title as product_title, p.status as product_status
       FROM product_variant pv
       JOIN product p ON p.id = pv.product_id
       WHERE pv.id = ? AND pv.deleted_at IS NULL AND p.deleted_at IS NULL
       LIMIT 1`,
      [variantId]
    )

    if (!variantQuery.rows || variantQuery.rows.length === 0) {
      return res.status(422).json({
        error: `Cannot publish landing page: Product variant "${variantId}" does not exist or has been deleted (AC-5.2).`,
      })
    }

    const { variant_title, product_title, product_status } = variantQuery.rows[0]

    if (product_status !== "published") {
      return res.status(422).json({
        error: `Cannot publish landing page: Linked product "${product_title}" (${product_status}) is not published (AC-5.2).`,
      })
    }

    // Check inventory availability (stocked - reserved)
    const stockQuery = await pg.raw(
      `SELECT COALESCE(SUM(il.stocked_quantity - il.reserved_quantity), 0) as available_stock
       FROM inventory_level il
       JOIN product_variant_inventory_item pvii ON pvii.inventory_item_id = il.inventory_item_id
       WHERE pvii.variant_id = ? AND il.deleted_at IS NULL`,
      [variantId]
    )

    const availableStock = Number(stockQuery.rows?.[0]?.available_stock || 0)
    if (availableStock <= 0) {
      return res.status(422).json({
        error: `Cannot publish landing page: Product variant "${product_title} - ${variant_title}" is out of stock (available: 0) (AC-5.2).`,
      })
    }
  }

  // 4. Create immutable Version Snapshot (database.md §3.9.2)
  const lastVerRes = await pg.raw(
    `SELECT COALESCE(MAX(version), 0) as max_version FROM landing_page_version WHERE landing_page_id = ?`,
    [id]
  )
  const nextVersion = Number(lastVerRes.rows[0].max_version) + 1
  const versionId = `lpver_${randomUUID().replace(/-/g, "").slice(0, 24)}`

  // Demote previous current versions
  await pg.raw(
    `UPDATE landing_page_version SET is_current = false WHERE landing_page_id = ?`,
    [id]
  )

  await pg.raw(
    `INSERT INTO landing_page_version (
      id, landing_page_id, version, sections_json, theme_tokens_json,
      seo_title_en, seo_title_bn, seo_description_en, seo_description_bn,
      published_at, published_by, is_current, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      now(), ?, true, now(), now()
    )`,
    [
      versionId,
      id,
      nextVersion,
      JSON.stringify(page.sections_json),
      page.theme_tokens_json ? JSON.stringify(page.theme_tokens_json) : null,
      page.seo_title_en,
      page.seo_title_bn,
      page.seo_description_en,
      page.seo_description_bn,
      (req as any).user?.id || "admin_user",
    ]
  )

  // 5. Update landing page status to 'published'
  await pg.raw(
    `UPDATE landing_page SET
      status = 'published',
      published_at = now(),
      published_version_id = ?,
      updated_at = now()
    WHERE id = ?`,
    [versionId, id]
  )

  const updatedPage = await pg.raw(`SELECT * FROM landing_page WHERE id = ?`, [id])

  return res.json({
    success: true,
    message: `Landing page published successfully at version ${nextVersion}.`,
    landing_page: updatedPage.rows[0],
    published_version: {
      id: versionId,
      version: nextVersion,
    },
  })
}
