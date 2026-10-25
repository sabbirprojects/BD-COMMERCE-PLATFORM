/**
 * Prompt 04 — Category Attributes & Custom Product Data Seed.
 *
 * Seeds:
 * 1. Category attributes & bilingual options for:
 *    - Footwear (upper_material, sole_material, closure_type, shoe_weight_grams, is_water_resistant)
 *    - Panjabi / Fashion (fabric_type, sleeve_type, fit_type)
 *    - Grocery (packaging_type, net_weight_grams, organic_certified) — strictly NO fashion size!
 * 2. Product BD profiles:
 *    - Loafer: primary_category_id = footwear, is_returnable = true
 *    - Panjabi: primary_category_id = panjabi, is_returnable = true
 *    - Mustard Oil: primary_category_id = grocery, is_returnable = false (perishable override)
 * 3. Product attribute values for seeded products.
 * 4. Effective-dated variant costs in integer paisa for Owner/Finance.
 *
 * Safe to rerun (idempotent).
 * Run: npx medusa exec ./src/scripts/seed/seed-prompt-04.ts
 */
import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { BD_CATALOG_MODULE } from "../../modules/bd-catalog"
import BdCatalogModuleService from "../../modules/bd-catalog/service"

export default async function seedPrompt04({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const productModule = container.resolve(Modules.PRODUCT) as any
  const bdCatalog = container.resolve<BdCatalogModuleService>(BD_CATALOG_MODULE)
  const link = container.resolve(ContainerRegistrationKeys.LINK)

  logger.info("--- Starting Prompt 04 Category Attributes & Product Data Seed ---")

  // 1. Fetch categories
  const categories = await productModule.listProductCategories({})
  const catByHandle = new Map<string, any>()
  for (const c of categories) {
    catByHandle.set(c.handle, c)
  }

  const footwearCat = catByHandle.get("footwear")
  const panjabiCat = catByHandle.get("panjabi")
  const groceryCat = catByHandle.get("grocery")

  if (!footwearCat || !panjabiCat || !groceryCat) {
    throw new Error("Categories not found. Run seed-catalog first.")
  }

  // 2. Define Category Attributes
  const attributeDefinitions = [
    // --- Footwear Attributes ---
    {
      category_id: footwearCat.id,
      code: "upper_material",
      name_en: "Upper Material",
      name_bn: "উপরিভাগের উপাদান",
      input_type: "enum" as const,
      is_required: true,
      sort_order: 1,
      options: [
        { value_code: "leather", label_en: "Genuine Leather", label_bn: "খাঁটি চামড়া", sort_order: 1 },
        { value_code: "mesh", label_en: "Breathable Mesh", label_bn: "মেস ফেব্রিক", sort_order: 2 },
        { value_code: "synthetic", label_en: "Synthetic Leather", label_bn: "কৃত্রিম চামড়া", sort_order: 3 },
      ],
    },
    {
      category_id: footwearCat.id,
      code: "sole_material",
      name_en: "Sole Material",
      name_bn: "তলার উপাদান",
      input_type: "enum" as const,
      is_required: false,
      sort_order: 2,
      options: [
        { value_code: "rubber", label_en: "Durable Rubber", label_bn: "মজবুত রাবার", sort_order: 1 },
        { value_code: "tpu", label_en: "TPU", label_bn: "টিপিইউ", sort_order: 2 },
        { value_code: "leather", label_en: "Leather Sole", label_bn: "লেদার সোল", sort_order: 3 },
      ],
    },
    {
      category_id: footwearCat.id,
      code: "closure_type",
      name_en: "Closure Type",
      name_bn: "বাঁধার ধরন",
      input_type: "enum" as const,
      is_required: false,
      sort_order: 3,
      options: [
        { value_code: "slip_on", label_en: "Slip-On", label_bn: "স্লিপ-অন", sort_order: 1 },
        { value_code: "lace_up", label_en: "Lace-Up", label_bn: "ফিতা লাগানো", sort_order: 2 },
      ],
    },
    {
      category_id: footwearCat.id,
      code: "shoe_weight_grams",
      name_en: "Weight",
      name_bn: "ওজন",
      input_type: "number" as const,
      unit: "g",
      is_required: false,
      sort_order: 4,
    },
    {
      category_id: footwearCat.id,
      code: "is_water_resistant",
      name_en: "Water Resistant",
      name_bn: "পানিনিরোধক",
      input_type: "boolean" as const,
      is_required: false,
      sort_order: 5,
    },

    // --- Panjabi / Clothing Attributes ---
    {
      category_id: panjabiCat.id,
      code: "fabric_type",
      name_en: "Fabric Type",
      name_bn: "কাপড়ের ধরন",
      input_type: "enum" as const,
      is_required: true,
      sort_order: 1,
      options: [
        { value_code: "cotton", label_en: "100% Combed Cotton", label_bn: "১০০% সুতি", sort_order: 1 },
        { value_code: "silk", label_en: "Silk Blend", label_bn: "সিল্ক ব্লেন্ড", sort_order: 2 },
        { value_code: "linen", label_en: "Linen", label_bn: "লিনেন", sort_order: 3 },
      ],
    },
    {
      category_id: panjabiCat.id,
      code: "sleeve_type",
      name_en: "Sleeve Type",
      name_bn: "হাতার ধরন",
      input_type: "enum" as const,
      is_required: false,
      sort_order: 2,
      options: [
        { value_code: "full_sleeve", label_en: "Full Sleeve", label_bn: "ফুল হাতা", sort_order: 1 },
        { value_code: "half_sleeve", label_en: "Half Sleeve", label_bn: "হাফ হাতা", sort_order: 2 },
      ],
    },
    {
      category_id: panjabiCat.id,
      code: "fit_type",
      name_en: "Fit Type",
      name_bn: "ফিটিং ধরন",
      input_type: "enum" as const,
      is_required: false,
      sort_order: 3,
      options: [
        { value_code: "semi_fitted", label_en: "Semi-Fitted", label_bn: "সেমি-ফিটেড", sort_order: 1 },
        { value_code: "regular", label_en: "Regular Fit", label_bn: "রেগুলার ফিট", sort_order: 2 },
      ],
    },

    // --- Grocery Attributes (Strictly NO fashion size!) ---
    {
      category_id: groceryCat.id,
      code: "packaging_type",
      name_en: "Packaging Type",
      name_bn: "প্যাকেজিং ধরন",
      input_type: "enum" as const,
      is_required: true,
      sort_order: 1,
      options: [
        { value_code: "bottle", label_en: "PET Bottle", label_bn: "বোতল", sort_order: 1 },
        { value_code: "pouch", label_en: "Refill Pouch", label_bn: "পাউচ", sort_order: 2 },
        { value_code: "can", label_en: "Tin Can", label_bn: "টিনের কৌটা", sort_order: 3 },
      ],
    },
    {
      category_id: groceryCat.id,
      code: "net_weight_grams",
      name_en: "Net Volume / Weight",
      name_bn: "পরিমাণ",
      input_type: "number" as const,
      unit: "ml",
      is_required: false,
      sort_order: 2,
    },
    {
      category_id: groceryCat.id,
      code: "organic_certified",
      name_en: "100% Organic Certified",
      name_bn: "শতভাগ প্রাকৃতিক ও অর্গানিক",
      input_type: "boolean" as const,
      is_required: false,
      sort_order: 3,
    },
  ]

  logger.info("Seeding category attributes and options...")
  const attrByCatAndCode = new Map<string, any>()

  for (const attrDef of attributeDefinitions) {
    const key = `${attrDef.category_id}:${attrDef.code}`
    let attr = (
      await bdCatalog.listCategoryAttributes({
        category_id: attrDef.category_id,
        code: attrDef.code,
      })
    )[0]

    if (!attr) {
      ;[attr] = await bdCatalog.createCategoryAttributes([
        {
          category_id: attrDef.category_id,
          code: attrDef.code,
          name_en: attrDef.name_en,
          name_bn: attrDef.name_bn,
          input_type: attrDef.input_type,
          unit: attrDef.unit || null,
          is_required: attrDef.is_required,
          is_filterable: true,
          sort_order: attrDef.sort_order,
          is_active: true,
        },
      ])
      logger.info(`Created attribute: ${attrDef.name_en} (${attr.id})`)
    }

    attrByCatAndCode.set(key, attr)

    if (attrDef.options && attrDef.options.length > 0) {
      for (const optDef of attrDef.options) {
        const existingOpt = (
          await bdCatalog.listCategoryAttributeOptions({
            category_attribute_id: attr.id,
            value_code: optDef.value_code,
          })
        )[0]

        if (!existingOpt) {
          await bdCatalog.createCategoryAttributeOptions([
            {
              category_attribute_id: attr.id,
              value_code: optDef.value_code,
              label_en: optDef.label_en,
              label_bn: optDef.label_bn,
              sort_order: optDef.sort_order,
              is_active: true,
            },
          ])
        }
      }
    }
  }

  // 3. Products
  const products = await productModule.listProducts({})
  const prodByHandle = new Map<string, any>()
  for (const p of products) {
    prodByHandle.set(p.handle, p)
  }

  const loafer = prodByHandle.get("mens-handcrafted-leather-loafer")
  const panjabi = prodByHandle.get("mens-semi-fitted-cotton-panjabi")
  const mustardOil = prodByHandle.get("pure-mustard-oil")

  // Seed Product BD Profile
  logger.info("Seeding Product BD Profiles...")

  if (loafer) {
    let prof = (await bdCatalog.listProductBdProfiles({ product_id: loafer.id }))[0]
    if (!prof) {
      ;[prof] = await bdCatalog.createProductBdProfiles([
        {
          product_id: loafer.id,
          primary_category_id: footwearCat.id,
          is_returnable: true,
          country_of_origin: "BD",
          warranty_note_en: "6 Months Craftsmanship Warranty",
          warranty_note_bn: "৬ মাসের প্রস্তুতকারী ওয়ারেন্টি",
          origin_note_en: "Handcrafted in Dhaka from export quality cowhide leather",
          origin_note_bn: "ঢাকায় দক্ষ কারিগর দ্বারা রফতানিমুখী খাঁটি চামড়ায় তৈরি",
          is_cod_allowed: true,
          created_by: "system_seed",
        },
      ])
      logger.info(`Created ProductBdProfile for Loafer (${prof.id})`)
    }

    try {
      await link.create({
        [Modules.PRODUCT]: { product_id: loafer.id },
        [BD_CATALOG_MODULE]: { product_bd_profile_id: prof.id },
      })
    } catch {}

    const loaferLoc = (await bdCatalog.listProductLocalizations({ product_id: loafer.id }))[0]
    if (loaferLoc) {
      try {
        await link.create({
          [Modules.PRODUCT]: { product_id: loafer.id },
          [BD_CATALOG_MODULE]: { product_localization_id: loaferLoc.id },
        })
      } catch {}
    }

    // Seed Loafer Attributes
    const upperAttr = attrByCatAndCode.get(`${footwearCat.id}:upper_material`)
    const soleAttr = attrByCatAndCode.get(`${footwearCat.id}:sole_material`)
    const closureAttr = attrByCatAndCode.get(`${footwearCat.id}:closure_type`)
    const weightAttr = attrByCatAndCode.get(`${footwearCat.id}:shoe_weight_grams`)
    const waterAttr = attrByCatAndCode.get(`${footwearCat.id}:is_water_resistant`)

    const loaferAttrValues = [
      { attr: upperAttr, text: "leather", codeRef: "leather" },
      { attr: soleAttr, text: "rubber", codeRef: "rubber" },
      { attr: closureAttr, text: "slip_on", codeRef: "slip_on" },
      { attr: weightAttr, number: 680 },
      { attr: waterAttr, boolean: true },
    ]

    for (const item of loaferAttrValues) {
      if (!item.attr) continue
      const existing = (
        await bdCatalog.listProductAttributeValues({
          product_id: loafer.id,
          category_attribute_id: item.attr.id,
        })
      )[0]
      if (!existing) {
        await bdCatalog.createProductAttributeValues([
          {
            product_id: loafer.id,
            category_attribute_id: item.attr.id,
            value_text: item.text || null,
            value_code_ref: item.codeRef || null,
            value_number: item.number || null,
            value_boolean: item.boolean ?? null,
          },
        ])
      }
    }
  }

  if (panjabi) {
    let prof = (await bdCatalog.listProductBdProfiles({ product_id: panjabi.id }))[0]
    if (!prof) {
      ;[prof] = await bdCatalog.createProductBdProfiles([
        {
          product_id: panjabi.id,
          primary_category_id: panjabiCat.id,
          is_returnable: true,
          country_of_origin: "BD",
          origin_note_en: "100% fine combed cotton sourced from Tangail weavers",
          origin_note_bn: "টাঙ্গাইলের ঐতিহ্যবাহী সুতা দিয়ে বোনা ১০০% ফাইন সুতি কাপড়ে তৈরি",
          is_cod_allowed: true,
          created_by: "system_seed",
        },
      ])
      logger.info(`Created ProductBdProfile for Panjabi (${prof.id})`)
    }

    try {
      await link.create({
        [Modules.PRODUCT]: { product_id: panjabi.id },
        [BD_CATALOG_MODULE]: { product_bd_profile_id: prof.id },
      })
    } catch {}

    const panjabiLoc = (await bdCatalog.listProductLocalizations({ product_id: panjabi.id }))[0]
    if (panjabiLoc) {
      try {
        await link.create({
          [Modules.PRODUCT]: { product_id: panjabi.id },
          [BD_CATALOG_MODULE]: { product_localization_id: panjabiLoc.id },
        })
      } catch {}
    }

    const fabricAttr = attrByCatAndCode.get(`${panjabiCat.id}:fabric_type`)
    const sleeveAttr = attrByCatAndCode.get(`${panjabiCat.id}:sleeve_type`)
    const fitAttr = attrByCatAndCode.get(`${panjabiCat.id}:fit_type`)

    const panjabiAttrValues = [
      { attr: fabricAttr, text: "cotton", codeRef: "cotton" },
      { attr: sleeveAttr, text: "full_sleeve", codeRef: "full_sleeve" },
      { attr: fitAttr, text: "semi_fitted", codeRef: "semi_fitted" },
    ]

    for (const item of panjabiAttrValues) {
      if (!item.attr) continue
      const existing = (
        await bdCatalog.listProductAttributeValues({
          product_id: panjabi.id,
          category_attribute_id: item.attr.id,
        })
      )[0]
      if (!existing) {
        await bdCatalog.createProductAttributeValues([
          {
            product_id: panjabi.id,
            category_attribute_id: item.attr.id,
            value_text: item.text || null,
            value_code_ref: item.codeRef || null,
          },
        ])
      }
    }
  }

  if (mustardOil) {
    let prof = (await bdCatalog.listProductBdProfiles({ product_id: mustardOil.id }))[0]
    if (!prof) {
      ;[prof] = await bdCatalog.createProductBdProfiles([
        {
          product_id: mustardOil.id,
          primary_category_id: groceryCat.id,
          is_returnable: false, // Perishable grocery: non-returnable hard override!
          country_of_origin: "BD",
          origin_note_en: "Cold pressed locally in Pabna mustard hub",
          origin_note_bn: "পাবনার সরিষা অঞ্চল থেকে সরাসরি ঘানিভাঙ্গা কোল্ড-প্রেসড",
          is_cod_allowed: true,
          created_by: "system_seed",
        },
      ])
      logger.info(`Created ProductBdProfile for Mustard Oil (${prof.id})`)
    }

    try {
      await link.create({
        [Modules.PRODUCT]: { product_id: mustardOil.id },
        [BD_CATALOG_MODULE]: { product_bd_profile_id: prof.id },
      })
    } catch {}

    const oilLoc = (await bdCatalog.listProductLocalizations({ product_id: mustardOil.id }))[0]
    if (oilLoc) {
      try {
        await link.create({
          [Modules.PRODUCT]: { product_id: mustardOil.id },
          [BD_CATALOG_MODULE]: { product_localization_id: oilLoc.id },
        })
      } catch {}
    }

    const packAttr = attrByCatAndCode.get(`${groceryCat.id}:packaging_type`)
    const weightAttr = attrByCatAndCode.get(`${groceryCat.id}:net_weight_grams`)
    const organicAttr = attrByCatAndCode.get(`${groceryCat.id}:organic_certified`)

    const oilAttrValues = [
      { attr: packAttr, text: "bottle", codeRef: "bottle" },
      { attr: weightAttr, number: 1000 },
      { attr: organicAttr, boolean: true },
    ]

    for (const item of oilAttrValues) {
      if (!item.attr) continue
      const existing = (
        await bdCatalog.listProductAttributeValues({
          product_id: mustardOil.id,
          category_attribute_id: item.attr.id,
        })
      )[0]
      if (!existing) {
        await bdCatalog.createProductAttributeValues([
          {
            product_id: mustardOil.id,
            category_attribute_id: item.attr.id,
            value_text: item.text || null,
            value_code_ref: item.codeRef || null,
            value_number: item.number || null,
            value_boolean: item.boolean ?? null,
          },
        ])
      }
    }
  }

  // Ensure all existing product localizations have valid module links
  const allLocalizations = await bdCatalog.listProductLocalizations({})
  for (const loc of allLocalizations) {
    try {
      await link.create({
        [Modules.PRODUCT]: { product_id: loc.product_id },
        [BD_CATALOG_MODULE]: { product_localization_id: loc.id },
      })
    } catch {}
  }

  // 4. Seed Variant Costs in Integer Paisa for Owner/Finance
  logger.info("Seeding variant costs (integer paisa)...")
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: fullProducts } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "variants.id", "variants.sku"],
    filters: {
      handle: [
        "mens-handcrafted-leather-loafer",
        "mens-semi-fitted-cotton-panjabi",
        "pure-mustard-oil",
      ],
    },
  })

  for (const prod of fullProducts || []) {
    for (const variant of prod.variants || []) {
      const existingCost = (
        await bdCatalog.listProductVariantCosts({
          variant_id: variant.id,
          effective_to: null,
        })
      )[0]

      if (!existingCost) {
        let cogsPaisa = 140000 // ৳1,400.00
        let packPaisa = 4000 // ৳40.00
        let supplier = "Apex BD Leatherworks"

        if (prod.handle === "pure-mustard-oil") {
          cogsPaisa = variant.sku?.includes("1L") ? 23000 : variant.sku?.includes("2L") ? 44000 : 105000
          packPaisa = 1500
          supplier = "Bengal Agro Mills"
        } else if (prod.handle === "mens-semi-fitted-cotton-panjabi") {
          cogsPaisa = 150000
          packPaisa = 3500
          supplier = "Aarong Weavers"
        } else if (prod.handle === "mens-handcrafted-leather-loafer") {
          cogsPaisa = 210000
          packPaisa = 5000
          supplier = "Apex BD Footwear Ltd"
        }

        const [createdCost] = await bdCatalog.createProductVariantCosts([
          {
            variant_id: variant.id,
            currency_code: "bdt",
            cogs_paisa: cogsPaisa,
            packaging_cost_paisa: packPaisa,
            estimated_shipping_cost_paisa: 6000,
            supplier_name: supplier,
            supplier_sku: `SUP-${variant.sku || "VAR"}`,
            minimum_margin_percent: 25,
            effective_from: new Date(),
            effective_to: null,
            change_reason: "Initial cost setup",
            changed_by: "system_seed",
          },
        ])
        logger.info(`Created variant cost for ${variant.sku || variant.id}`)

        try {
          await link.create({
            [Modules.PRODUCT]: { product_variant_id: variant.id },
            [BD_CATALOG_MODULE]: { product_variant_cost_id: createdCost.id },
          })
        } catch {}
      } else {
        try {
          await link.create({
            [Modules.PRODUCT]: { product_variant_id: variant.id },
            [BD_CATALOG_MODULE]: { product_variant_cost_id: existingCost.id },
          })
        } catch {}
      }
    }
  }

  logger.info("--- Prompt 04 Seed Completed Successfully ---")
}
