import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BD_CATALOG_MODULE } from "../../../../../modules/bd-catalog"
import BdCatalogModuleService from "../../../../../modules/bd-catalog/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const bdCatalogService = req.scope.resolve<BdCatalogModuleService>(BD_CATALOG_MODULE)

  const attributes = await bdCatalogService.listCategoryAttributes(
    { category_id: id, is_active: true },
    { order: { sort_order: "ASC", created_at: "ASC" } }
  )

  const attributeIds = attributes.map((a: any) => a.id)
  let optionsByAttrId: Record<string, any[]> = {}

  if (attributeIds.length > 0) {
    const options = await bdCatalogService.listCategoryAttributeOptions(
      { category_attribute_id: attributeIds, is_active: true },
      { order: { sort_order: "ASC" } }
    )
    for (const opt of options as any[]) {
      if (!optionsByAttrId[opt.category_attribute_id]) {
        optionsByAttrId[opt.category_attribute_id] = []
      }
      optionsByAttrId[opt.category_attribute_id].push(opt)
    }
  }

  const result = attributes.map((a: any) => ({
    ...a,
    options: optionsByAttrId[a.id] || [],
  }))

  res.json({ attributes: result })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const body = req.body as {
    code?: string
    name_en?: string
    name_bn?: string
    input_type?: "text" | "number" | "enum" | "boolean"
    unit?: string | null
    help_text_en?: string | null
    help_text_bn?: string | null
    is_required?: boolean
    is_filterable?: boolean
    sort_order?: number
    options?: Array<{
      value_code: string
      label_en: string
      label_bn: string
      sort_order?: number
    }>
  }

  if (!body.code || typeof body.code !== "string") {
    res.status(400).json({ message: "code is required and must be a string" })
    return
  }
  if (!body.name_en || !body.name_bn) {
    res.status(400).json({ message: "Bilingual names (name_en and name_bn) are required" })
    return
  }

  const allowedTypes = ["text", "number", "enum", "boolean"]
  const inputType = body.input_type || "text"
  if (!allowedTypes.includes(inputType)) {
    res.status(400).json({
      message: `Invalid input_type. Allowed types: ${allowedTypes.join(", ")}`,
    })
    return
  }

  const normalizedCode = body.code
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/(^_|_$)/g, "")

  const bdCatalogService = req.scope.resolve<BdCatalogModuleService>(BD_CATALOG_MODULE)

  // Check unique code per category
  const existing = await bdCatalogService.listCategoryAttributes({
    category_id: id,
    code: normalizedCode,
  })
  if (existing && existing.length > 0) {
    res.status(400).json({
      message: `Attribute with code '${normalizedCode}' already exists for this category`,
    })
    return
  }

  const [attribute] = await bdCatalogService.createCategoryAttributes([
    {
      category_id: id,
      code: normalizedCode,
      name_en: body.name_en.trim(),
      name_bn: body.name_bn.trim(),
      input_type: inputType,
      unit: body.unit || null,
      help_text_en: body.help_text_en || null,
      help_text_bn: body.help_text_bn || null,
      is_required: body.is_required ?? false,
      is_filterable: body.is_filterable ?? true,
      sort_order: body.sort_order ?? 0,
      is_active: true,
    },
  ])

  let createdOptions: any[] = []
  if (inputType === "enum" && Array.isArray(body.options) && body.options.length > 0) {
    createdOptions = await bdCatalogService.createCategoryAttributeOptions(
      body.options.map((opt, idx) => ({
        category_attribute_id: attribute.id,
        value_code: opt.value_code.trim().toLowerCase(),
        label_en: opt.label_en.trim(),
        label_bn: opt.label_bn.trim(),
        sort_order: opt.sort_order ?? idx,
        is_active: true,
      }))
    )
  }

  res.status(201).json({
    attribute: {
      ...attribute,
      options: createdOptions,
    },
  })
}
