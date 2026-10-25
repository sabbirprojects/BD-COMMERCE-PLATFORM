import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { BD_CATALOG_MODULE } from "../../../../../modules/bd-catalog"
import BdCatalogModuleService from "../../../../../modules/bd-catalog/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const bdCatalogService = req.scope.resolve<BdCatalogModuleService>(BD_CATALOG_MODULE)

  // 1. Determine active category
  let categoryId = req.query.category_id as string | undefined

  if (!categoryId) {
    // Check product_bd_profile
    const profiles = await bdCatalogService.listProductBdProfiles({ product_id: id })
    if (profiles?.[0]?.primary_category_id) {
      categoryId = profiles[0].primary_category_id
    }
  }

  if (!categoryId) {
    // Check Medusa product categories
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    try {
      const { data: products } = await query.graph({
        entity: "product",
        fields: ["id", "categories.id"],
        filters: { id },
      })
      if (products?.[0]?.categories?.[0]?.id) {
        categoryId = products[0].categories[0].id
      }
    } catch {
      // Continue if query graph fails
    }
  }

  if (!categoryId) {
    res.json({ category_id: null, attributes: [] })
    return
  }

  // 2. Fetch category attributes
  const attributes = await bdCatalogService.listCategoryAttributes(
    { category_id: categoryId, is_active: true },
    { order: { sort_order: "ASC" } }
  )

  const attrIds = attributes.map((a: any) => a.id)
  let optionsByAttrId: Record<string, any[]> = {}
  if (attrIds.length > 0) {
    const options = await bdCatalogService.listCategoryAttributeOptions(
      { category_attribute_id: attrIds, is_active: true },
      { order: { sort_order: "ASC" } }
    )
    for (const opt of options as any[]) {
      if (!optionsByAttrId[opt.category_attribute_id]) {
        optionsByAttrId[opt.category_attribute_id] = []
      }
      optionsByAttrId[opt.category_attribute_id].push(opt)
    }
  }

  // 3. Fetch existing product attribute values
  const currentValues = await bdCatalogService.listProductAttributeValues({
    product_id: id,
  })
  const valuesByAttrId = new Map<string, any>()
  for (const v of currentValues as any[]) {
    valuesByAttrId.set(v.category_attribute_id, v)
  }

  const result = attributes.map((attr: any) => {
    const currentVal = valuesByAttrId.get(attr.id)
    return {
      ...attr,
      options: optionsByAttrId[attr.id] || [],
      current_value: currentVal
        ? {
            id: currentVal.id,
            value_text: currentVal.value_text,
            value_number: currentVal.value_number,
            value_boolean: currentVal.value_boolean,
            value_code_ref: currentVal.value_code_ref,
          }
        : null,
    }
  })

  res.json({ category_id: categoryId, attributes: result })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const body = req.body as {
    category_id?: string
    values?: Record<string, any>
  }

  const valuesPayload = body.values || {}
  const bdCatalogService = req.scope.resolve<BdCatalogModuleService>(BD_CATALOG_MODULE)

  // 1. Determine active category
  let categoryId = body.category_id
  if (!categoryId) {
    const profiles = await bdCatalogService.listProductBdProfiles({ product_id: id })
    if (profiles?.[0]?.primary_category_id) {
      categoryId = profiles[0].primary_category_id
    }
  }

  if (!categoryId) {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    try {
      const { data: products } = await query.graph({
        entity: "product",
        fields: ["id", "categories.id"],
        filters: { id },
      })
      if (products?.[0]?.categories?.[0]?.id) {
        categoryId = products[0].categories[0].id
      }
    } catch {
      // Continue
    }
  }

  if (!categoryId) {
    res.status(400).json({ message: "No category associated with product" })
    return
  }

  // 2. Fetch category attributes and their options for validation
  const attributes = await bdCatalogService.listCategoryAttributes({
    category_id: categoryId,
    is_active: true,
  })

  const attrIds = attributes.map((a: any) => a.id)
  const options = attrIds.length > 0
    ? await bdCatalogService.listCategoryAttributeOptions({
        category_attribute_id: attrIds,
        is_active: true,
      })
    : []

  const optionsByAttrId = new Map<string, Set<string>>()
  for (const opt of options as any[]) {
    if (!optionsByAttrId.has(opt.category_attribute_id)) {
      optionsByAttrId.set(opt.category_attribute_id, new Set())
    }
    optionsByAttrId.get(opt.category_attribute_id)!.add(opt.value_code)
  }

  // 3. Validate required fields and types
  const existingValues = await bdCatalogService.listProductAttributeValues({
    product_id: id,
  })
  const existingMap = new Map<string, any>()
  for (const ev of existingValues as any[]) {
    existingMap.set(ev.category_attribute_id, ev)
  }

  const toCreate: any[] = []
  const toUpdate: any[] = []

  for (const attr of attributes as any[]) {
    const rawVal = valuesPayload[attr.code] !== undefined ? valuesPayload[attr.code] : valuesPayload[attr.id]

    // Required check
    if (attr.is_required && (rawVal === undefined || rawVal === null || rawVal === "")) {
      res.status(400).json({
        message: `Attribute '${attr.name_en}' is required for this category.`,
      })
      return
    }

    if (rawVal === undefined || rawVal === null || rawVal === "") {
      continue
    }

    let valText: string | null = null
    let valNumber: number | null = null
    let valBoolean: boolean | null = null
    let valCodeRef: string | null = null

    switch (attr.input_type) {
      case "number": {
        const num = Number(rawVal)
        if (isNaN(num)) {
          res.status(400).json({
            message: `Attribute '${attr.name_en}' must be a valid number.`,
          })
          return
        }
        valNumber = num
        break
      }
      case "boolean": {
        valBoolean = rawVal === true || rawVal === "true" || rawVal === 1 || rawVal === "1"
        break
      }
      case "enum": {
        const strVal = String(rawVal).trim().toLowerCase()
        const validOptions = optionsByAttrId.get(attr.id)
        if (validOptions && !validOptions.has(strVal)) {
          res.status(400).json({
            message: `Invalid option '${rawVal}' for attribute '${attr.name_en}'.`,
          })
          return
        }
        valCodeRef = strVal
        valText = strVal
        break
      }
      case "text":
      default: {
        valText = String(rawVal).trim()
        break
      }
    }

    const existing = existingMap.get(attr.id)
    if (existing) {
      toUpdate.push({
        id: existing.id,
        value_text: valText,
        value_number: valNumber,
        value_boolean: valBoolean,
        value_code_ref: valCodeRef,
      })
    } else {
      toCreate.push({
        product_id: id,
        category_attribute_id: attr.id,
        value_text: valText,
        value_number: valNumber,
        value_boolean: valBoolean,
        value_code_ref: valCodeRef,
      })
    }
  }

  if (toCreate.length > 0) {
    await bdCatalogService.createProductAttributeValues(toCreate)
  }
  for (const upd of toUpdate) {
    await bdCatalogService.updateProductAttributeValues(upd)
  }

  // Also update primary_category_id on product_bd_profile if provided
  if (body.category_id) {
    const existingProfile = (
      await bdCatalogService.listProductBdProfiles({ product_id: id })
    )[0]
    if (existingProfile) {
      await bdCatalogService.updateProductBdProfiles({
        id: existingProfile.id,
        primary_category_id: body.category_id,
      })
    } else {
      await bdCatalogService.createProductBdProfiles([
        {
          product_id: id,
          primary_category_id: body.category_id,
        },
      ])
    }
  }

  const updatedValues = await bdCatalogService.listProductAttributeValues({
    product_id: id,
  })

  res.json({
    message: "Product attributes updated successfully",
    values: updatedValues,
  })
}
