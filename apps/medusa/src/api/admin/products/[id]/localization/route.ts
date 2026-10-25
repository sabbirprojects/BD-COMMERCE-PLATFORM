import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BD_CATALOG_MODULE } from "../../../../../modules/bd-catalog"
import BdCatalogModuleService from "../../../../../modules/bd-catalog/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const bdCatalogService = req.scope.resolve<BdCatalogModuleService>(BD_CATALOG_MODULE)

  const localizations = await bdCatalogService.listProductLocalizations({
    product_id: id,
  })

  let nativeTranslation = null
  try {
    const translationService = req.scope.resolve("translation") as any
    const translations = await translationService.listTranslations({
      reference: "product",
      reference_id: id,
      locale_code: "bn",
    })
    nativeTranslation = translations?.[0] || null
  } catch (e) {
    // If translation service is unavailable, continue
  }

  res.json({
    localization: localizations?.[0] || null,
    native_translation: nativeTranslation,
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const body = req.body as {
    care_instructions_bn?: string | null
    origin_country_bn?: string | null
    description_excerpt_bn?: string | null
    meta_title_bn?: string | null
    meta_description_bn?: string | null
    handle_bn?: string | null
    translation_source?: "manual" | "machine"
    is_reviewed?: boolean
    title_bn?: string | null
    description_bn?: string | null
  }

  const bdCatalogService = req.scope.resolve<BdCatalogModuleService>(BD_CATALOG_MODULE)

  const existing = await bdCatalogService.listProductLocalizations({
    product_id: id,
  })

  const user = (req as any).user || (req as any).auth_context?.actor_id
  const reviewedBy = body.is_reviewed ? (user?.id || user || "admin") : null
  const reviewedAt = body.is_reviewed ? new Date() : null

  let localization: any
  if (existing && existing.length > 0) {
    const updatePayload: Record<string, any> = {
      id: existing[0].id,
      care_instructions_bn: body.care_instructions_bn ?? existing[0].care_instructions_bn,
      origin_country_bn: body.origin_country_bn ?? existing[0].origin_country_bn,
      description_excerpt_bn: body.description_excerpt_bn ?? existing[0].description_excerpt_bn,
      meta_title_bn: body.meta_title_bn ?? existing[0].meta_title_bn,
      meta_description_bn: body.meta_description_bn ?? existing[0].meta_description_bn,
      handle_bn: body.handle_bn ?? existing[0].handle_bn,
      translation_source: body.translation_source ?? existing[0].translation_source,
    }

    if (body.is_reviewed !== undefined) {
      updatePayload.translation_status = body.is_reviewed ? "reviewed" : "draft"
      updatePayload.is_bilingual_complete = body.is_reviewed
      updatePayload.reviewed_by = reviewedBy
      updatePayload.reviewed_at = reviewedAt
    }

    localization = await bdCatalogService.updateProductLocalizations(updatePayload)
  } else {
    const [created] = await bdCatalogService.createProductLocalizations([
      {
        product_id: id,
        care_instructions_bn: body.care_instructions_bn || null,
        origin_country_bn: body.origin_country_bn || null,
        description_excerpt_bn: body.description_excerpt_bn || null,
        meta_title_bn: body.meta_title_bn || null,
        meta_description_bn: body.meta_description_bn || null,
        handle_bn: body.handle_bn || null,
        translation_source: body.translation_source || "manual",
        translation_status: body.is_reviewed ? "reviewed" : "draft",
        is_bilingual_complete: body.is_reviewed ?? false,
        reviewed_by: reviewedBy,
        reviewed_at: reviewedAt,
      },
    ])
    localization = created
  }

  // Also update native translation if title_bn or description_bn was sent
  let nativeTranslation = null
  if (body.title_bn !== undefined || body.description_bn !== undefined) {
    try {
      const translationService = req.scope.resolve("translation") as any
      const existingTrans = await translationService.listTranslations({
        reference: "product",
        reference_id: id,
        locale_code: "bn",
      })

      const valuesToPersist: Record<string, string> = {
        ...(existingTrans?.[0]?.translations || {}),
      }
      if (body.title_bn !== undefined) valuesToPersist.title = body.title_bn || ""
      if (body.description_bn !== undefined) valuesToPersist.description = body.description_bn || ""

      if (existingTrans && existingTrans.length > 0) {
        nativeTranslation = await translationService.updateTranslations({
          id: existingTrans[0].id,
          translations: valuesToPersist,
        })
      } else {
        const [createdTrans] = await translationService.createTranslations([
          {
            reference: "product",
            reference_id: id,
            locale_code: "bn",
            translations: valuesToPersist,
          },
        ])
        nativeTranslation = createdTrans
      }
    } catch (e) {
      // translation service optional fallback
    }
  }

  res.json({
    localization,
    native_translation: nativeTranslation,
  })
}
