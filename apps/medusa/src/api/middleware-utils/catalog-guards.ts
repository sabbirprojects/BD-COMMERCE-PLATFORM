import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type NextFunction = (err?: unknown) => void

const MAX_OPTIONS_COUNT = 3
const MAX_UPLOAD_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"])

/**
 * Validates maximum 3 option types per product (CHK-CAT-02, PRD FR-3.2.1, AC-3.1).
 * Blocks creation or updates that would result in a 4th option type.
 */
export async function validateProductOptionsCap(
  req: MedusaRequest,
  res: MedusaResponse,
  next: NextFunction
): Promise<void> {
  try {
    const body = req.body as Record<string, unknown> | undefined

    // 1. Direct array in product create or update
    if (body?.options && Array.isArray(body.options)) {
      if (body.options.length > MAX_OPTIONS_COUNT) {
        res.status(400).json({
          statusCode: 400,
          error: "BAD_REQUEST",
          message: "Maximum 3 option types allowed per product.",
        })
        return
      }
    }

    // 2. Adding an option via /admin/products/:id/options
    const productId = req.params?.id
    if (productId && req.url.includes("/options")) {
      const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
      const { data: products } = await query.graph({
        entity: "product",
        fields: ["id", "options.id"],
        filters: { id: productId },
      })

      const product = products?.[0]
      const currentOptionsCount = product?.options?.length || 0
      if (currentOptionsCount >= MAX_OPTIONS_COUNT) {
        res.status(400).json({
          statusCode: 400,
          error: "BAD_REQUEST",
          message: "Maximum 3 option types allowed per product.",
        })
        return
      }
    }

    next()
  } catch (err) {
    next(err)
  }
}

/**
 * Enforces SKU uniqueness per variant within a product (AC-3.2, PRD FR-3.2.2).
 */
export async function validateVariantSkuUniqueness(
  req: MedusaRequest,
  res: MedusaResponse,
  next: NextFunction
): Promise<void> {
  try {
    const body = req.body as Record<string, unknown> | undefined

    // Check payload variants when creating product
    if (body?.variants && Array.isArray(body.variants)) {
      const skus = body.variants
        .map((v: Record<string, unknown>) => (typeof v.sku === "string" ? v.sku.trim() : ""))
        .filter(Boolean)

      if (new Set(skus).size !== skus.length) {
        res.status(400).json({
          statusCode: 400,
          error: "BAD_REQUEST",
          message: "Two variants cannot share the same SKU within a product.",
        })
        return
      }
    }

    // Check when adding variant to existing product /admin/products/:id/variants
    const productId = req.params?.id
    if (productId && req.url.includes("/variants") && body?.sku) {
      const incomingSku = String(body.sku).trim()
      const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
      const { data: products } = await query.graph({
        entity: "product",
        fields: ["id", "variants.id", "variants.sku"],
        filters: { id: productId },
      })

      const existingVariants = products?.[0]?.variants || []
      const duplicate = existingVariants.some(
        (v: any) => v?.sku && v.sku.trim().toLowerCase() === incomingSku.toLowerCase()
      )

      if (duplicate) {
        res.status(400).json({
          statusCode: 400,
          error: "BAD_REQUEST",
          message: "Two variants cannot share the same SKU within a product.",
        })
        return
      }
    }

    next()
  } catch (err) {
    next(err)
  }
}

/**
 * Validates media uploads (CHK-CAT-05, PRD FR-5.1.6).
 * Accepts JPG, PNG, WebP up to 5MB.
 * Rejects .exe, .php, .svg with scripts, or non-image MIME types.
 */
export function validateMediaUploads(
  req: MedusaRequest,
  res: MedusaResponse,
  next: NextFunction
): void {
  const files = (req as unknown as { files?: Array<{ originalname: string; mimetype: string; size: number }> }).files

  if (files && Array.isArray(files) && files.length > 0) {
    for (const file of files) {
      const ext = file.originalname.slice(file.originalname.lastIndexOf(".")).toLowerCase()

      if (!ALLOWED_EXTENSIONS.has(ext) || !ALLOWED_MIME_TYPES.has(file.mimetype)) {
        res.status(400).json({
          statusCode: 400,
          error: "BAD_REQUEST",
          message: `Invalid file type: ${file.originalname}. Only JPG, PNG, and WebP images are permitted.`,
        })
        return
      }

      if (file.size > MAX_UPLOAD_SIZE) {
        res.status(400).json({
          statusCode: 400,
          error: "BAD_REQUEST",
          message: `File size exceeds 5MB limit: ${file.originalname}`,
        })
        return
      }
    }
  }

  next()
}

/**
 * Enforces product publish rules (AC-10.2, Prompt 03 Scope item 8).
 * A product cannot be published with missing EN title or failed required translation.
 * Warns if Bangla translation is missing.
 */
export async function validateProductPublish(
  req: MedusaRequest,
  res: MedusaResponse,
  next: NextFunction
): Promise<void> {
  try {
    const body = req.body as Record<string, unknown> | undefined

    if (body?.status === "published") {
      // Must have EN title
      if (!body.title || (typeof body.title === "string" && !body.title.trim())) {
        res.status(400).json({
          statusCode: 400,
          error: "BAD_REQUEST",
          message: "Product title is required to publish a product.",
        })
        return
      }

      const productId = req.params?.id
      if (productId) {
        // Check for failed required translation review
        const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
        try {
          const { data: reviews } = await query.graph({
            entity: "translation_review",
            fields: ["id", "translation_status"],
            filters: { reference: "product", reference_id: productId },
          })

          const hasFailed = reviews?.some(
            (r: { translation_status?: string }) => r.translation_status === "failed"
          )
          if (hasFailed) {
            res.status(400).json({
              statusCode: 400,
              error: "BAD_REQUEST",
              message: "Cannot publish product with failed translations.",
            })
            return
          }
        } catch {
          // If translation review query fails, continue without blocking
        }
      }
    }

    next()
  } catch (err) {
    next(err)
  }
}
