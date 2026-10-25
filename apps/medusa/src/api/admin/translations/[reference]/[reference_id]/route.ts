import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BD_CATALOG_MODULE } from "../../../../../modules/bd-catalog"
import BdCatalogModuleService from "../../../../../modules/bd-catalog/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { reference, reference_id } = req.params
  const locale_code = (req.query.locale_code as string) || "bn"

  const translationService = req.scope.resolve("translation")
  const bdCatalogService = req.scope.resolve<BdCatalogModuleService>(BD_CATALOG_MODULE)

  const translations = await translationService.listTranslations({
    reference,
    reference_id,
    locale_code,
  })

  const reviews = await bdCatalogService.listTranslationReviews({
    reference,
    reference_id,
    locale_code,
  })

  res.json({
    translation: translations?.[0] || null,
    review: reviews?.[0] || null,
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { reference, reference_id } = req.params
  const body = req.body as {
    translations?: Record<string, unknown>
    locale_code?: string
    translation_source?: "manual" | "machine"
    translation_status?: "draft" | "reviewed" | "published" | "failed"
    failure_reason?: string
    reviewed_by?: string
  }

  const locale_code = body.locale_code || "bn"
  const translation_source = body.translation_source || "manual"

  // Governance rule: Never auto-publish machine drafts (PRD FR-10.3.4, database.md §3.3.2)
  let translation_status = body.translation_status || "draft"
  if (translation_source === "machine" && translation_status === "published" && !body.reviewed_by) {
    translation_status = "draft"
  }

  const translationService = req.scope.resolve("translation")
  const bdCatalogService = req.scope.resolve<BdCatalogModuleService>(BD_CATALOG_MODULE)

  // 1. Upsert native translation
  let translationRecord: any = null
  if (body.translations) {
    const existing = await translationService.listTranslations({
      reference,
      reference_id,
      locale_code,
    })

    if (existing?.length > 0) {
      translationRecord = await translationService.updateTranslations({
        id: existing[0].id,
        translations: body.translations,
      })
    } else {
      translationRecord = await translationService.createTranslations({
        reference,
        reference_id,
        locale_code,
        translations: body.translations,
      })
    }
  }

  // 2. Upsert translation_review governance record
  const existingReviews = await bdCatalogService.listTranslationReviews({
    reference,
    reference_id,
    locale_code,
  })

  let reviewRecord: any = null
  const reviewPayload = {
    reference,
    reference_id,
    locale_code,
    translation_source,
    translation_status,
    failure_reason: body.failure_reason || null,
    reviewed_by: body.reviewed_by || null,
    reviewed_at: body.reviewed_by ? new Date() : null,
    fields_json: body.translations || null,
  }

  if (existingReviews?.length > 0) {
    reviewRecord = await bdCatalogService.updateTranslationReviews({
      id: existingReviews[0].id,
      ...reviewPayload,
    })
  } else {
    const [createdReview] = await bdCatalogService.createTranslationReviews([reviewPayload])
    reviewRecord = createdReview
  }

  res.json({
    translation: translationRecord,
    review: reviewRecord,
  })
}
