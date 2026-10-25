import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /store/landing-pages/[slug]
 * Public storefront API to fetch a published campaign landing page.
 * Unlisted / draft pages strictly return 404.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any
  const { slug } = req.params

  const pageRes = await pg.raw(
    `SELECT * FROM landing_page
     WHERE slug = ? AND status = 'published' AND deleted_at IS NULL
       AND (starts_at IS NULL OR starts_at <= now())
       AND (ends_at IS NULL OR ends_at >= now())
     LIMIT 1`,
    [slug.toLowerCase()]
  )

  if (!pageRes.rows || pageRes.rows.length === 0) {
    return res.status(404).json({
      error: "Campaign landing page not found or is currently inactive.",
      error_bn: "ক্যাম্পেইন পেজটি খুঁজে পাওয়া যায়নি বা বর্তমানে নিষ্ক্রিয় রয়েছে।",
    })
  }

  const page = pageRes.rows[0]

  // Fetch active offers with variant and stock information
  const offersRes = await pg.raw(
    `SELECT 
      lpo.id,
      lpo.landing_page_id,
      lpo.variant_id,
      lpo.offer_price_paisa,
      lpo.bundle_qty,
      lpo.label_en,
      lpo.label_bn,
      lpo.starts_at,
      lpo.ends_at,
      lpo.is_active,
      pv.title as variant_title,
      pv.sku,
      p.id as product_id,
      p.title as product_title,
      p.thumbnail as product_thumbnail,
      COALESCE(SUM(il.stocked_quantity - il.reserved_quantity), 0) as available_stock,
      (lpo.ends_at IS NOT NULL AND lpo.ends_at < now()) as is_expired
     FROM landing_page_offer lpo
     JOIN product_variant pv ON pv.id = lpo.variant_id
     JOIN product p ON p.id = pv.product_id
     LEFT JOIN product_variant_inventory_item pvii ON pvii.variant_id = pv.id
     LEFT JOIN inventory_level il ON il.inventory_item_id = pvii.inventory_item_id AND il.deleted_at IS NULL
     WHERE lpo.landing_page_id = ? 
       AND lpo.is_active = true 
       AND lpo.deleted_at IS NULL
       AND (lpo.starts_at IS NULL OR lpo.starts_at <= now())
     GROUP BY lpo.id, pv.id, p.id
     ORDER BY lpo.sort_order ASC`,
    [page.id]
  )

  const offers = offersRes.rows || []

  return res.json({
    landing_page: {
      id: page.id,
      slug: page.slug,
      title_en: page.title_en,
      title_bn: page.title_bn,
      checkout_mode: page.checkout_mode,
      default_locale: page.default_locale,
      canonical_url: page.canonical_url,
      seo_title_en: page.seo_title_en,
      seo_title_bn: page.seo_title_bn,
      seo_description_en: page.seo_description_en,
      seo_description_bn: page.seo_description_bn,
      sections: page.sections_json,
      theme_tokens: page.theme_tokens_json,
      offers,
    },
    offers,
  })
}
