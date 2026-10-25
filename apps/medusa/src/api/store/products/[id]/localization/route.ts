import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { BD_CATALOG_MODULE } from "../../../../../modules/bd-catalog"
import BdCatalogModuleService from "../../../../../modules/bd-catalog/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const bdCatalogService = req.scope.resolve<BdCatalogModuleService>(BD_CATALOG_MODULE)

  // 1. Verify product exists
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  let product: any = null
  try {
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "title", "categories.id"],
      filters: { id },
    })
    product = products?.[0] || null
  } catch {
    // continue
  }

  if (!product) {
    res.status(404).json({ message: `Product with ID ${id} not found` })
    return
  }

  // 2. Fetch non-core editorial localization
  const localizations = await bdCatalogService.listProductLocalizations({
    product_id: id,
  })
  const loc = localizations?.[0] || null

  // 3. Fetch native translation for title / description / material
  let nativeTranslation = null
  try {
    const translationService = req.scope.resolve("translation") as any
    const translations = await translationService.listTranslations({
      reference: "product",
      reference_id: id,
      locale_code: "bn",
    })
    nativeTranslation = translations?.[0]?.translations || null
  } catch {
    // continue
  }

  // 4. Fetch Brand info if linked
  let brand: any = null
  try {
    const productBrands = await bdCatalogService.listProductBrands({
      product_id: id,
    })
    if (productBrands && productBrands.length > 0) {
      const b = await bdCatalogService.retrieveBrand(productBrands[0].brand_id).catch(() => null)
      if (b && b.is_active) {
        brand = {
          id: b.id,
          name_en: b.name_en,
          name_bn: b.name_bn,
          slug: b.slug,
          logo_key: b.logo_key,
          description_en: b.description_en,
          description_bn: b.description_bn,
        }
      }
    }
  } catch {
    // continue
  }

  // 5. Fetch Product Bangladesh Commercial Profile (database.md §3.3.3)
  const profiles = await bdCatalogService.listProductBdProfiles({ product_id: id })
  const prof = profiles?.[0] || null

  const profilePayload = prof
    ? {
        is_returnable: prof.is_returnable,
        warranty_note_en: prof.warranty_note_en,
        warranty_note_bn: prof.warranty_note_bn,
        origin_note_en: prof.origin_note_en,
        origin_note_bn: prof.origin_note_bn,
        country_of_origin: prof.country_of_origin || "BD",
        is_cod_allowed: prof.is_cod_allowed,
        min_order_qty: prof.min_order_qty,
        max_order_qty: prof.max_order_qty,
      }
    : {
        is_returnable: true,
        warranty_note_en: null,
        warranty_note_bn: null,
        origin_note_en: null,
        origin_note_bn: null,
        country_of_origin: "BD",
        is_cod_allowed: true,
        min_order_qty: null,
        max_order_qty: null,
      }

  // 6. Fetch Category-Specific Attributes for PDP
  const categoryId = prof?.primary_category_id || product?.categories?.[0]?.id
  let attributesPayload: any[] = []

  if (categoryId) {
    const categoryAttrs = await bdCatalogService.listCategoryAttributes(
      { category_id: categoryId, is_active: true },
      { order: { sort_order: "ASC" } }
    )

    const attrValues = await bdCatalogService.listProductAttributeValues({
      product_id: id,
    })
    const valueByAttrId = new Map<string, any>()
    for (const v of attrValues as any[]) {
      valueByAttrId.set(v.category_attribute_id, v)
    }

    const attrIds = categoryAttrs.map((a: any) => a.id)
    const options = attrIds.length > 0
      ? await bdCatalogService.listCategoryAttributeOptions({
          category_attribute_id: attrIds,
          is_active: true,
        })
      : []

    const optionMap = new Map<string, { label_en: string; label_bn: string }>()
    for (const opt of options as any[]) {
      optionMap.set(`${opt.category_attribute_id}:${opt.value_code}`, {
        label_en: opt.label_en,
        label_bn: opt.label_bn,
      })
    }

    for (const attr of categoryAttrs as any[]) {
      const val = valueByAttrId.get(attr.id)
      if (!val) continue

      let displayValue: any = null
      let labelEn: string | null = null
      let labelBn: string | null = null

      if (attr.input_type === "enum") {
        displayValue = val.value_code_ref || val.value_text
        const opt = optionMap.get(`${attr.id}:${displayValue}`)
        if (opt) {
          labelEn = opt.label_en
          labelBn = opt.label_bn
        }
      } else if (attr.input_type === "number") {
        displayValue = val.value_number
      } else if (attr.input_type === "boolean") {
        displayValue = val.value_boolean
      } else {
        displayValue = val.value_text
      }

      if (displayValue !== null && displayValue !== undefined) {
        attributesPayload.push({
          code: attr.code,
          name_en: attr.name_en,
          name_bn: attr.name_bn,
          unit: attr.unit,
          input_type: attr.input_type,
          value: displayValue,
          label_en: labelEn,
          label_bn: labelBn,
        })
      }
    }
  }

  // Strictly sanitized public payload — ZERO internal cost paisa or COGS
  res.json({
    product_id: id,
    brand,
    profile: profilePayload,
    localization: loc
      ? {
          care_instructions_bn: loc.care_instructions_bn,
          origin_country_bn: loc.origin_country_bn,
          description_excerpt_bn: loc.description_excerpt_bn,
          meta_title_bn: loc.meta_title_bn,
          meta_description_bn: loc.meta_description_bn,
          handle_bn: loc.handle_bn,
          is_reviewed: loc.translation_status === "reviewed",
        }
      : null,
    translation_bn: nativeTranslation,
    attributes: attributesPayload,
  })
}
