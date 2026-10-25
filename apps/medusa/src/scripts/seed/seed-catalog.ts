/**
 * Prompt 03 — Catalog foundation seed.
 *
 * Creates:
 *   - Categories: Men's Fashion (parent) -> Panjabi (child), Grocery, Footwear
 *   - Brands: Aarong Style, Bengal Grocers, Apex BD
 *   - 3 Published products + 1 Unpublished draft:
 *     1. Men's Semi-Fitted Cotton Panjabi (Size+Color, unique SKUs, BDT 2,500)
 *     2. Pure Mustard Oil (1L/2L/5L, BDT 320)
 *     3. Men's Handcrafted Leather Loafer (Size+Color, BDT 3,500)
 *     4. Traditional Embroidered Kurti (Draft preview, unpublished)
 *   - Full EN + BN translations (native translation module)
 *   - ProductLocalization records (excerpt, care instructions, origin country, SEO meta, handle_bn)
 *   - ProductBrand links
 *
 * Idempotency: checks for existing categories, brands, and products before inserting.
 * Safe to re-run.
 *
 * Run: npx medusa exec ./src/scripts/seed/seed-catalog.ts
 */
import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import { createProductsWorkflow } from "@medusajs/medusa/core-flows"
import { BD_CATALOG_MODULE } from "../../modules/bd-catalog"
import BdCatalogModuleService from "../../modules/bd-catalog/service"

export default async function seedCatalog({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const productModule = container.resolve(Modules.PRODUCT) as any
  const salesChannelModule = container.resolve(Modules.SALES_CHANNEL) as any
  const bdCatalog = container.resolve<BdCatalogModuleService>(BD_CATALOG_MODULE)
  let translationModule: any = null
  try {
    translationModule = container.resolve("translation")
  } catch {
    logger.warn("translation module not resolved via 'translation'")
  }

  logger.info("--- Starting Prompt 03 Catalog Foundation Seed ---")

  // 1. Get Default Sales Channel & Default Shipping Profile
  const [defaultSalesChannel] = await salesChannelModule.listSalesChannels(
    { name: "Default Sales Channel" },
    { take: 1 }
  )
  if (!defaultSalesChannel) {
    throw new Error("Default Sales Channel not found. Run seed-foundation first.")
  }

  // 2. Seed Categories
  // Men's Fashion -> Panjabi
  // Grocery
  // Footwear
  logger.info("Seeding product categories...")

  let mensFashion = (
    await productModule.listProductCategories({ handle: "mens-fashion" })
  )[0]
  if (!mensFashion) {
    mensFashion = await productModule.createProductCategories({
      name: "Men's Fashion",
      handle: "mens-fashion",
      is_active: true,
      is_internal: false,
    })
    logger.info(`Created category: Men's Fashion (${mensFashion.id})`)
  }

  let panjabi = (
    await productModule.listProductCategories({ handle: "panjabi" })
  )[0]
  if (!panjabi) {
    panjabi = await productModule.createProductCategories({
      name: "Panjabi",
      handle: "panjabi",
      parent_category_id: mensFashion.id,
      is_active: true,
      is_internal: false,
    })
    logger.info(`Created category: Panjabi (${panjabi.id}) -> parent: ${mensFashion.name}`)
  }

  let grocery = (
    await productModule.listProductCategories({ handle: "grocery" })
  )[0]
  if (!grocery) {
    grocery = await productModule.createProductCategories({
      name: "Grocery",
      handle: "grocery",
      is_active: true,
      is_internal: false,
    })
    logger.info(`Created category: Grocery (${grocery.id})`)
  }

  let footwear = (
    await productModule.listProductCategories({ handle: "footwear" })
  )[0]
  if (!footwear) {
    footwear = await productModule.createProductCategories({
      name: "Footwear",
      handle: "footwear",
      is_active: true,
      is_internal: false,
    })
    logger.info(`Created category: Footwear (${footwear.id})`)
  }

  // 3. Seed Brands
  logger.info("Seeding brands...")
  const brandDefs = [
    {
      slug: "aarong-style",
      name_en: "Aarong Style",
      name_bn: "আড়ং স্টাইল",
      description_en: "Authentic Bangladeshi ethnic apparel and craftsmanship.",
      description_bn: "ঐতিহ্যবাহী বাংলাদেশি পোশাক ও হস্তশিল্প সম্ভার।",
      is_active: true,
      sort_order: 1,
    },
    {
      slug: "bengal-grocers",
      name_en: "Bengal Grocers",
      name_bn: "বেঙ্গল গ্রোসার্স",
      description_en: "Pure, fresh everyday groceries sourced locally.",
      description_bn: "স্থানীয়ভাবে সংগৃহীত খাঁটি ও তাজা নিত্যপ্রয়োজনীয় মুদি পণ্য।",
      is_active: true,
      sort_order: 2,
    },
    {
      slug: "apex-bd",
      name_en: "Apex BD",
      name_bn: "এপেক্স বিডি",
      description_en: "Premium leather footwear and accessories.",
      description_bn: "প্রিমিয়াম চামড়ার পাদুকা ও অনুষঙ্গ।",
      is_active: true,
      sort_order: 3,
    },
  ]

  const brandMap = new Map<string, any>()
  for (const b of brandDefs) {
    let brand = (await bdCatalog.listBrands({ slug: b.slug }))[0]
    if (!brand) {
      ;[brand] = await bdCatalog.createBrands([b])
      logger.info(`Created brand: ${b.name_en} (${brand.id})`)
    } else {
      logger.info(`Brand already exists: ${b.name_en} (${brand.id})`)
    }
    brandMap.set(b.slug, brand)
  }

  // 4. Products Definition
  const productConfigs = [
    // Product 1: Panjabi
    {
      handle: "mens-semi-fitted-cotton-panjabi",
      title: "Men's Semi-Fitted Cotton Panjabi",
      description:
        "Premium cotton semi-fitted panjabi designed for style and comfort, perfect for festivals and casual wear.",
      status: "published" as const,
      category_id: panjabi.id,
      brand_slug: "aarong-style",
      options: [
        { title: "Size", values: ["M", "L", "XL"] },
        { title: "Color", values: ["White", "Navy Blue"] },
      ],
      variants: [
        {
          title: "M / White",
          sku: "PANJABI-M-WHT",
          options: { Size: "M", Color: "White" },
          prices: [{ currency_code: "bdt", amount: 2500 }],
        },
        {
          title: "L / White",
          sku: "PANJABI-L-WHT",
          options: { Size: "L", Color: "White" },
          prices: [{ currency_code: "bdt", amount: 2500 }],
        },
        {
          title: "XL / White",
          sku: "PANJABI-XL-WHT",
          options: { Size: "XL", Color: "White" },
          prices: [{ currency_code: "bdt", amount: 2500 }],
        },
        {
          title: "M / Navy Blue",
          sku: "PANJABI-M-NAV",
          options: { Size: "M", Color: "Navy Blue" },
          prices: [{ currency_code: "bdt", amount: 2500 }],
        },
        {
          title: "L / Navy Blue",
          sku: "PANJABI-L-NAV",
          options: { Size: "L", Color: "Navy Blue" },
          prices: [{ currency_code: "bdt", amount: 2500 }],
        },
        {
          title: "XL / Navy Blue",
          sku: "PANJABI-XL-NAV",
          options: { Size: "XL", Color: "Navy Blue" },
          prices: [{ currency_code: "bdt", amount: 2500 }],
        },
      ],
      bn_translation: {
        title: "পুরুষদের সেমি-ফিটেড সুতি পাঞ্জাবি",
        description:
          "আরামদায়ক ও আকর্ষণীয় ডিজাইনের প্রিমিয়াম সুতি সেমি-ফিটেড পাঞ্জাবি, যা উৎসব ও দৈনন্দিন ব্যবহারের জন্য অত্যন্ত মানানসই।",
      },
      localization: {
        description_excerpt_bn: "প্রিমিয়াম সুতি পাঞ্জাবি",
        care_instructions_bn: "ঠাণ্ডা পানিতে আলতো করে হাত দিয়ে ধোবেন, কড়া রোদে শুকাবেন না",
        origin_country_bn: "বাংলাদেশ",
        meta_title_bn: "পুরুষদের সেমি-ফিটেড সুতি পাঞ্জাবি - অনলাইন শপ",
        meta_description_bn:
          "সেরা মানের পুরুষদের সেমি-ফিটেড সুতি পাঞ্জাবি কিনুন সাশ্রয়ী মূল্যে।",
        handle_bn: "mens-semi-fitted-cotton-panjabi-bn",
        translation_source: "manual" as const,
        translation_status: "reviewed" as const,
        is_bilingual_complete: true,
      },
    },

    // Product 2: Mustard Oil
    {
      handle: "pure-mustard-oil",
      title: "Pure Mustard Oil",
      description:
        "Cold-pressed pure mustard oil extracted from the highest grade mustard seeds. Retains rich pungent aroma and natural antioxidants.",
      status: "published" as const,
      category_id: grocery.id,
      brand_slug: "bengal-grocers",
      options: [{ title: "Volume", values: ["1L", "2L", "5L"] }],
      variants: [
        {
          title: "1 Liter",
          sku: "OIL-MUSTARD-1L",
          options: { Volume: "1L" },
          prices: [{ currency_code: "bdt", amount: 320 }],
        },
        {
          title: "2 Liter",
          sku: "OIL-MUSTARD-2L",
          options: { Volume: "2L" },
          prices: [{ currency_code: "bdt", amount: 620 }],
        },
        {
          title: "5 Liter",
          sku: "OIL-MUSTARD-5L",
          options: { Volume: "5L" },
          prices: [{ currency_code: "bdt", amount: 1500 }],
        },
      ],
      bn_translation: {
        title: "খাঁটি সরিষার তেল",
        description:
          "উচ্চমানের সরিষা দানা থেকে কোল্ড-প্রেসড বা ঘানিভাঙ্গা পদ্ধতিতে প্রস্তুতকৃত শতভাগ খাঁটি সরিষার তেল। খাঁটি ঝাঁঝ ও প্রাকৃতিক পুষ্টিগুণ অক্ষুণ্ণ।",
      },
      localization: {
        description_excerpt_bn: "কোল্ড-প্রেসড খাঁটি সরিষার তেল",
        care_instructions_bn: "শুষ্ক ও শীতল স্থানে মুখবন্ধ পাত্রে সংরক্ষণ করুন",
        origin_country_bn: "বাংলাদেশ",
        meta_title_bn: "খাঁটি সরিষার তেল - ১০০% প্রাকৃতিক",
        meta_description_bn:
          "ঘরোয়া রান্নার জন্য ১০০% খাঁটি কোল্ড-প্রেসড ঘানিভাঙ্গা সরিষার তেল।",
        handle_bn: "pure-mustard-oil-bn",
        translation_source: "manual" as const,
        translation_status: "reviewed" as const,
        is_bilingual_complete: true,
      },
    },

    // Product 3: Leather Loafer
    {
      handle: "mens-handcrafted-leather-loafer",
      title: "Men's Handcrafted Leather Loafer",
      description:
        "Classic genuine leather loafers handcrafted for enduring comfort and timeless elegance. Cushioned insole and durable outsole.",
      status: "published" as const,
      category_id: footwear.id,
      brand_slug: "apex-bd",
      options: [
        { title: "Size", values: ["40", "41", "42", "43"] },
        { title: "Color", values: ["Black", "Brown"] },
      ],
      variants: [
        {
          title: "40 / Black",
          sku: "LOAFER-40-BLK",
          options: { Size: "40", Color: "Black" },
          prices: [{ currency_code: "bdt", amount: 3500 }],
        },
        {
          title: "41 / Black",
          sku: "LOAFER-41-BLK",
          options: { Size: "41", Color: "Black" },
          prices: [{ currency_code: "bdt", amount: 3500 }],
        },
        {
          title: "42 / Black",
          sku: "LOAFER-42-BLK",
          options: { Size: "42", Color: "Black" },
          prices: [{ currency_code: "bdt", amount: 3500 }],
        },
        {
          title: "43 / Black",
          sku: "LOAFER-43-BLK",
          options: { Size: "43", Color: "Black" },
          prices: [{ currency_code: "bdt", amount: 3500 }],
        },
        {
          title: "40 / Brown",
          sku: "LOAFER-40-BRN",
          options: { Size: "40", Color: "Brown" },
          prices: [{ currency_code: "bdt", amount: 3500 }],
        },
        {
          title: "41 / Brown",
          sku: "LOAFER-41-BRN",
          options: { Size: "41", Color: "Brown" },
          prices: [{ currency_code: "bdt", amount: 3500 }],
        },
        {
          title: "42 / Brown",
          sku: "LOAFER-42-BRN",
          options: { Size: "42", Color: "Brown" },
          prices: [{ currency_code: "bdt", amount: 3500 }],
        },
        {
          title: "43 / Brown",
          sku: "LOAFER-43-BRN",
          options: { Size: "43", Color: "Brown" },
          prices: [{ currency_code: "bdt", amount: 3500 }],
        },
      ],
      bn_translation: {
        title: "পুরুষদের হাতে তৈরি চামড়ার লোফার",
        description:
          "আভিজাত্য ও দীর্ঘস্থায়িত্বের জন্য খাঁটি চামড়া দিয়ে নিখুঁত কারুকাজে তৈরি ক্লাসিক লোফার জুতা। আরামদায়ক ইনসোল ও মজবুত গ্রিপ।",
      },
      localization: {
        description_excerpt_bn: "খাঁটি চামড়ার হ্যান্ডক্রাফটেড লোফার",
        care_instructions_bn:
          "চামড়ার মানসম্মত পলিশ দিয়ে নিয়মিত যত্ন নিন, সরাসরি পানি ও কড়া রোদ থেকে দূরে রাখুন",
        origin_country_bn: "বাংলাদেশ",
        meta_title_bn: "পুরুষদের লেদার লোফার জুতা - প্রিমিয়াম কোয়ালিটি",
        meta_description_bn:
          "আভিজাত্য ও প্রিমিয়াম ফিনিশের জেনুইন লেদার লোফার জুতা।",
        handle_bn: "mens-handcrafted-leather-loafer-bn",
        translation_source: "manual" as const,
        translation_status: "reviewed" as const,
        is_bilingual_complete: true,
      },
    },

    // Product 4: Unpublished Draft Product
    {
      handle: "traditional-embroidered-kurti-draft",
      title: "Traditional Embroidered Kurti (Draft Preview)",
      description:
        "Draft product for upcoming seasonal campaign. High-neck embroidered kurti on georgette fabric.",
      status: "draft" as const,
      category_id: mensFashion.id,
      brand_slug: "aarong-style",
      options: [{ title: "Size", values: ["S", "M", "L"] }],
      variants: [
        {
          title: "S",
          sku: "KURTI-DRFT-S",
          options: { Size: "S" },
          prices: [{ currency_code: "bdt", amount: 1800 }],
        },
        {
          title: "M",
          sku: "KURTI-DRFT-M",
          options: { Size: "M" },
          prices: [{ currency_code: "bdt", amount: 1800 }],
        },
        {
          title: "L",
          sku: "KURTI-DRFT-L",
          options: { Size: "L" },
          prices: [{ currency_code: "bdt", amount: 1800 }],
        },
      ],
      bn_translation: {
        title: "ঐতিহ্যবাহী এমব্রয়ডারি কুর্তি (খসড়া)",
        description:
          "আসন্ন উৎসব কালেকশনের জন্য প্রস্তুতকৃত আধুনিক নকশার জর্জেট এমব্রয়ডারি কুর্তি।",
      },
      localization: {
        description_excerpt_bn: "খসড়া এমব্রয়ডারি কুর্তি",
        care_instructions_bn: "শুধুমাত্র ড্রাই ক্লিন করুন",
        origin_country_bn: "বাংলাদেশ",
        meta_title_bn: "ঐতিহ্যবাহী এমব্রয়ডারি কুর্তি",
        meta_description_bn: "উৎসবের জন্য বিশেষ ডিজাইনের কুর্তি।",
        handle_bn: "traditional-embroidered-kurti-draft-bn",
        translation_source: "manual" as const,
        translation_status: "draft" as const,
        is_bilingual_complete: true,
      },
    },
  ]

  logger.info("Seeding products with workflows...")

  for (const pConfig of productConfigs) {
    const existing = (await productModule.listProducts({ handle: pConfig.handle }))[0]
    let productId = existing?.id

    if (!existing) {
      logger.info(`Creating product: ${pConfig.title} (status: ${pConfig.status})...`)
      const workflowResult = await createProductsWorkflow(container).run({
        input: {
          products: [
            {
              title: pConfig.title,
              handle: pConfig.handle,
              description: pConfig.description,
              status: pConfig.status,
              sales_channels: [{ id: defaultSalesChannel.id }],
              category_ids: [pConfig.category_id],
              options: pConfig.options,
              variants: pConfig.variants,
            },
          ],
        },
      })

      const created = workflowResult.result[0]
      productId = created.id
      logger.info(`Created product: ${created.title} (${productId})`)
    } else {
      logger.info(`Product already exists: ${existing.title} (${productId})`)
    }

    // 5. Link Brand
    const brand = brandMap.get(pConfig.brand_slug)
    if (brand && productId) {
      const existingBrandLink = (
        await bdCatalog.listProductBrands({ product_id: productId })
      )[0]
      if (!existingBrandLink) {
        await bdCatalog.createProductBrands([
          {
            product_id: productId,
            brand_id: brand.id,
          },
        ])
        logger.info(`Linked brand ${brand.name_en} to product ${productId}`)
      }
    }

    // 6. Seed Native Translation (BN)
    if (translationModule && productId) {
      const existingTrans = (
        await translationModule.listTranslations({
          reference: "product",
          reference_id: productId,
          locale_code: "bn",
        })
      )[0]

      if (!existingTrans) {
        await translationModule.createTranslations([
          {
            reference: "product",
            reference_id: productId,
            locale_code: "bn",
            translations: pConfig.bn_translation,
          },
        ])
        logger.info(`Created native BN translation for product ${productId}`)
      }
    }

    // 7. Seed ProductLocalization
    if (productId) {
      const existingLoc = (
        await bdCatalog.listProductLocalizations({ product_id: productId })
      )[0]

      if (!existingLoc) {
        await bdCatalog.createProductLocalizations([
          {
            product_id: productId,
            ...pConfig.localization,
            reviewed_by: "system_seed",
            reviewed_at: new Date(),
          },
        ])
        logger.info(`Created ProductLocalization for product ${productId}`)
      }
    }
  }

  logger.info("--- Prompt 03 Catalog Foundation Seed Completed Successfully ---")
}
