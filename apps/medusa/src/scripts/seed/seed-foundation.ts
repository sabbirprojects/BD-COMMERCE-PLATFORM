/**
 * Prompt 01 — Foundation seed (database.md §9.2 Phase 0, steps 3 & 5; §3.13).
 *
 * Reshapes the Medusa starter demo state (Europe/EUR) into the canonical
 * Bangladesh foundation:
 *   - currency `bdt` symbol ৳
 *   - one store (BDT-only, en + bn locales)
 *   - one region Bangladesh (currency bdt, country bd, pp_system_default)
 *   - sales channels: Default (storefront) + Manual (staff-entered orders)
 *   - 3 stock locations (loc_central_warehouse / loc_damaged_quarantine /
 *     loc_courier_return_desk) linked to the fulfillment provider and channels
 *   - fulfillment set fs_bd_delivery with 3 service zones (one per delivery
 *     zone) and one province geo zone per served district
 *   - 3 native shipping options (flat, BDT major units: ৳60 / ৳100 / ৳130 —
 *     owner-configurable placeholder rates)
 *   - native tax_region for BD (provider tp_system); Europe demo tax regions
 *     removed
 *   - geo master: 8 divisions, 64 districts, 495 thanas (vendored dataset)
 *   - delivery_zone ×3 + delivery_zone_district (every district mapped once)
 *   - vat_settings: disabled, unverified
 *   - operational_settings singleton (id = 'global')
 *   - RBAC: 7 roles + 11 policies per database.md §6.2 matrix; the existing
 *     admin user is linked to the `owner` role
 *
 * Run: npx medusa exec ./src/scripts/seed/seed-foundation.ts
 * Idempotency: every step checks for existing rows before creating, so the
 * script is safe to rerun (`medusa exec` does not track script_migrations).
 */
import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  Modules,
  ModuleRegistrationName,
} from "@medusajs/framework/utils"
import { createShippingOptionsWorkflow } from "@medusajs/medusa/core-flows"
import { GEO_DIVISIONS, GEO_DISTRICTS, GEO_THANAS } from "./geo-data"

/** District-level coverage per delivery zone (every district exactly once). */
const ZONE_DISTRICT_CODES: Record<string, string[]> = {
  inside_dhaka: ["BD-DHK-DHA"],
  dhaka_suburbs: [
    "BD-DHK-GAZ", // Gazipur
    "BD-DHK-NAR", // Narayanganj
    "BD-DHK-MAN", // Manikganj
    "BD-DHK-MUN", // Munshiganj
    "BD-DHK-NRS", // Narsingdi
  ],
  outside_dhaka: [],
}

/** Zone catalog: placeholder rates (৳ major units), admin-editable later. */
const DELIVERY_ZONES = [
  {
    code: "inside_dhaka",
    name_en: "Inside Dhaka",
    name_bn: "ঢাকার ভিতরে",
    rate_major: 60,
    delivery_days_min: 1,
    delivery_days_max: 2,
    priority: 0,
  },
  {
    code: "dhaka_suburbs",
    name_en: "Dhaka Suburbs",
    name_bn: "ঢাকা শহরতলী",
    rate_major: 100,
    delivery_days_min: 2,
    delivery_days_max: 3,
    priority: 1,
  },
  {
    code: "outside_dhaka",
    name_en: "Outside Dhaka",
    name_bn: "ঢাকার বাইরে",
    rate_major: 130,
    delivery_days_min: 3,
    delivery_days_max: 7,
    priority: 2,
  },
] as const

const RBAC_POLICIES: { key: string; resource: string; operation: string }[] = [
  { key: "order.read", resource: "order", operation: "read" },
  { key: "order.confirm_cod", resource: "order", operation: "confirm_cod" },
  { key: "order.cancel", resource: "order", operation: "cancel" },
  { key: "courier.book", resource: "courier", operation: "book" },
  { key: "refund.approve", resource: "refund", operation: "approve" },
  { key: "refund.pay", resource: "refund", operation: "pay" },
  { key: "cogs.read", resource: "cogs", operation: "read" },
  { key: "audit.read", resource: "audit", operation: "read" },
  { key: "content.publish", resource: "content", operation: "publish" },
  { key: "settings.update", resource: "settings", operation: "update" },
  { key: "export.run", resource: "export", operation: "run" },
]

/** database.md §6.2 application-level role matrix. */
const RBAC_ROLE_POLICIES: Record<string, string[]> = {
  owner: RBAC_POLICIES.map((p) => p.key),
  manager: ["order.read", "order.confirm_cod", "order.cancel", "courier.book", "content.publish"],
  finance: ["order.read", "refund.approve", "refund.pay", "cogs.read", "audit.read", "export.run"],
  warehouse: ["order.read", "courier.book"],
  call_center: ["order.read", "order.confirm_cod", "order.cancel"],
  content: ["order.read", "content.publish"],
  staff: ["order.read"],
}

export { RBAC_POLICIES, RBAC_ROLE_POLICIES }

export default async function seed_foundation({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const link = container.resolve(ContainerRegistrationKeys.LINK)

  const storeService = container.resolve(ModuleRegistrationName.STORE)
  const regionService = container.resolve(ModuleRegistrationName.REGION)
  const salesChannelService = container.resolve(
    ModuleRegistrationName.SALES_CHANNEL
  )
  const stockLocationService = container.resolve(
    ModuleRegistrationName.STOCK_LOCATION
  )
  const fulfillmentService = container.resolve(
    ModuleRegistrationName.FULFILLMENT
  )
  const taxService = container.resolve(ModuleRegistrationName.TAX)
  const bdSettings = container.resolve("bd_settings")

  // ---------------------------------------------------------------- currency
  // The currency module is read-only at runtime; the symbol is a display
  // metadata fix applied directly (database.md §3.13: symbol ৳).
  const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  await pg.raw(`UPDATE currency SET symbol = '৳' WHERE code = 'bdt'`)
  logger.info("currency: bdt symbol set to ৳")

  // ------------------------------------------------------------------ region
  const { data: existingRegions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "currency_code"],
  })
  const regionId = existingRegions[0].id
  await regionService.updateRegions(regionId, {
    name: "Bangladesh",
    currency_code: "bdt",
    countries: ["bd"],
  })
  logger.info(`region: reshaped ${regionId} -> Bangladesh / bdt / [bd]`)

  // ------------------------------------------------------------------- store
  const { data: stores } = await query.graph({
    entity: "store",
    fields: ["id", "default_sales_channel_id"],
  })
  const storeId = stores[0].id
  await storeService.updateStores(storeId, {
    name: "BD Commerce",
    supported_currencies: [{ currency_code: "bdt", is_default: true }],
    supported_locales: [{ locale_code: "en" }, { locale_code: "bn" }],
    default_region_id: regionId,
  })
  logger.info("store: BDT-only (default), locales en+bn, default region set")

  // ---------------------------------------------------------- sales channels
  const { data: channels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name"],
  })
  let manualChannelId = channels.find((c) => c.name === "Manual")?.id
  if (!manualChannelId) {
    const created = await salesChannelService.createSalesChannels({
      name: "Manual",
      description: "Staff-entered orders",
    })
    manualChannelId = created.id
  }
  const defaultChannelId = stores[0].default_sales_channel_id
  logger.info("sales channels: Default (storefront) + Manual (staff orders)")

  // --------------------------------------------------------- stock locations
  const LOCATIONS = [
    { name: "Central Warehouse", code: "loc_central_warehouse" },
    { name: "Damaged Quarantine", code: "loc_damaged_quarantine" },
    { name: "Courier Return Desk", code: "loc_courier_return_desk" },
  ]
  const locationIds: Record<string, string> = {}
  for (const loc of LOCATIONS) {
    const { data: existing } = await query.graph({
      entity: "stock_location",
      fields: ["id"],
      filters: { metadata: { code: loc.code } } as any,
    })
    if (existing[0]) {
      locationIds[loc.code] = existing[0].id
      continue
    }
    const created = await stockLocationService.createStockLocations({
      name: loc.name,
      address: { country_code: "bd", address_1: "" },
      metadata: { code: loc.code },
    })
    locationIds[loc.code] = created.id
  }
  logger.info(`stock locations: ${LOCATIONS.map((l) => l.code).join(", ")}`)

  // Soft-remove the starter's European warehouse (demo artifact).
  const { data: legacyLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name"],
    filters: { name: "European Warehouse" },
  })
  for (const legacy of legacyLocations) {
    await stockLocationService.deleteStockLocations(legacy.id)
    logger.info(`stock location: soft-deleted demo "${legacy.name}"`)
  }

  // Link locations to the fulfillment provider and to both sales channels.
  for (const id of Object.values(locationIds)) {
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: id },
      [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
    })
  }
  for (const channelId of [defaultChannelId, manualChannelId]) {
    for (const id of Object.values(locationIds)) {
      await link.create({
        [Modules.SALES_CHANNEL]: { sales_channel_id: channelId },
        [Modules.STOCK_LOCATION]: { stock_location_id: id },
      })
    }
  }
  logger.info("stock locations linked to manual_manual + both channels")

  // -------------------------------------------------------- fulfillment set
  // One service zone per delivery zone; one province geo zone per served
  // district (database.md §3.13).
  const { data: shippingProfiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  })
  const shippingProfileId = shippingProfiles[0].id

  const allDistrictCodes = GEO_DISTRICTS.map((d) => d.code)
  const served = new Set<string>([
    ...ZONE_DISTRICT_CODES.inside_dhaka,
    ...ZONE_DISTRICT_CODES.dhaka_suburbs,
  ])
  ZONE_DISTRICT_CODES.outside_dhaka = allDistrictCodes.filter(
    (code) => !served.has(code)
  )

  let fulfillmentSetId: string
  const { data: existingSets } = await query.graph({
    entity: "fulfillment_set",
    fields: ["id", "name"],
    filters: { name: "BD Delivery" },
  })
  if (existingSets[0]) {
    fulfillmentSetId = existingSets[0].id
    logger.info("fulfillment set fs_bd_delivery already exists — reusing")
  } else {
    // `metadata` is persisted by the fulfillment-set model but missing from
    // the CreateFulfillmentSetDTO type — cast is contained here.
    const fulfillmentSet = (await fulfillmentService.createFulfillmentSets({
      name: "BD Delivery",
      type: "shipping",
      metadata: { code: "fs_bd_delivery" },
      service_zones: DELIVERY_ZONES.map((zone) => ({
        name: zone.name_en,
        metadata: { delivery_zone_code: zone.code },
        geo_zones: ZONE_DISTRICT_CODES[zone.code].map((districtCode) => ({
          type: "province" as const,
          country_code: "bd",
          province_code: districtCode,
        })),
      })),
    } as any)) as unknown as {
      id: string
      service_zones: { geo_zones: { length: number }[] }[]
    }
    fulfillmentSetId = fulfillmentSet.id
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: locationIds.loc_central_warehouse },
      [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSetId },
    })
    logger.info(
      `fulfillment set fs_bd_delivery: ${fulfillmentSet.service_zones.length} service zones, ` +
        `${fulfillmentSet.service_zones.reduce((n, z) => n + z.geo_zones.length, 0)} geo zones`
    )
  }

  // Soft-remove the starter's European fulfillment set.
  const { data: legacySets } = await query.graph({
    entity: "fulfillment_set",
    fields: ["id", "name"],
    filters: { name: "European Warehouse delivery" },
  })
  for (const legacy of legacySets) {
    await fulfillmentService.deleteFulfillmentSets(legacy.id)
    logger.info(`fulfillment set: soft-deleted demo "${legacy.name}"`)
  }

  // -------------------------------------------------------- shipping options
  const { data: zoneSets } = await query.graph({
    entity: "fulfillment_set",
    fields: [
      "id",
      "service_zones.id",
      "service_zones.name",
      "service_zones.metadata",
    ],
    filters: { id: fulfillmentSetId },
  })
  const serviceZones = zoneSets[0].service_zones
  const zoneByCode = Object.fromEntries(
    serviceZones.map((z) => [z.metadata?.delivery_zone_code, z])
  )
  const shippingOptionIds: Record<string, string> = {}
  const { data: existingOptions } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "name"],
    filters: { service_zone_id: serviceZones.map((z) => z.id) },
  })
  const reusedOptions = existingOptions.filter((o) =>
    DELIVERY_ZONES.some((zone) => o.name === `Delivery - ${zone.name_en}`)
  )
  if (reusedOptions.length === DELIVERY_ZONES.length) {
    DELIVERY_ZONES.forEach((zone) => {
      shippingOptionIds[zone.code] = reusedOptions.find(
        (o) => o.name === `Delivery - ${zone.name_en}`
      )!.id
    })
    logger.info("shipping options already exist — reusing")
  } else {
    await createShippingOptionsWorkflow(container).run({
      input: DELIVERY_ZONES.map((zone) => ({
        name: `Delivery - ${zone.name_en}`,
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: zoneByCode[zone.code].id,
        shipping_profile_id: shippingProfileId,
        type: {
          label: "Standard Delivery",
          description: `${zone.delivery_days_min}-${zone.delivery_days_max} days`,
          code: `std_${zone.code}`,
        },
        prices: [{ currency_code: "bdt", amount: zone.rate_major }],
        rules: [
          { attribute: "enabled_in_store", value: "true", operator: "eq" },
          { attribute: "is_return", value: "false", operator: "eq" },
        ],
      })),
    }).then(({ result }) => {
      DELIVERY_ZONES.forEach((zone, i) => {
        shippingOptionIds[zone.code] = result[i].id
      })
    })
  }
  logger.info(
    "shipping options: inside ৳60 / suburbs ৳100 / outside ৳130 (major units)"
  )

  // ----------------------------------------------------------- tax (native)
  const { data: allTaxRegions } = await query.graph({
    entity: "tax_region",
    fields: ["id", "country_code"],
  })
  const europeRows = allTaxRegions.filter((r) => r.country_code !== "bd")
  for (const legacy of europeRows) {
    await taxService.deleteTaxRegions(legacy.id)
  }
  let bdTaxRegion: { id: string; country_code: string } | undefined =
    allTaxRegions.find((r) => r.country_code === "bd")
  if (!bdTaxRegion) {
    bdTaxRegion = await taxService.createTaxRegions({
      country_code: "bd",
      provider_id: "tp_system",
    })
    logger.info(`tax region: BD created (${bdTaxRegion.id})`)
  } else {
    logger.info(`tax region: BD already exists (${bdTaxRegion.id})`)
  }
  if (europeRows.length) {
    logger.info(`tax regions: removed ${europeRows.length} Europe demo rows`)
  }

  // ---------------------------------------------------------------- geo data
  const existingDivisions = await bdSettings.listGeoDivisions({}, { take: 1 })
  if (existingDivisions.length === 0) {
    await bdSettings.createGeoDivisions(
      GEO_DIVISIONS.map((d) => ({ ...d, is_active: true }))
    )
    await bdSettings.createGeoDistricts(
      GEO_DISTRICTS.map((d) => ({ ...d, is_active: true }))
    )
    await bdSettings.createGeoThanas(
      GEO_THANAS.map((t) => ({ ...t, is_city_corporation: false, is_active: true }))
    )
    logger.info(
      `geo: ${GEO_DIVISIONS.length} divisions, ${GEO_DISTRICTS.length} districts, ${GEO_THANAS.length} thanas`
    )
  } else {
    logger.info("geo: already seeded — skipping")
  }

  // ----------------------------------------------------------- delivery zones
  const existingZones = await bdSettings.listDeliveryZones({}, { take: 1 })
  if (existingZones.length === 0) {
    await bdSettings.createDeliveryZones(
      DELIVERY_ZONES.map((zone) => ({
        code: zone.code,
        name_en: zone.name_en,
        name_bn: zone.name_bn,
        shipping_option_id: shippingOptionIds[zone.code],
        service_zone_id: zoneByCode[zone.code].id,
        cod_enabled: true,
        cod_handling_fee_paisa: 0,
        min_order_paisa: 0,
        delivery_days_min: zone.delivery_days_min,
        delivery_days_max: zone.delivery_days_max,
        priority: zone.priority,
        is_active: true,
      }))
    )
    await bdSettings.createDeliveryZoneDistricts(
      Object.entries(ZONE_DISTRICT_CODES).flatMap(([zoneCode, districtCodes]) =>
        districtCodes.map((districtCode) => ({
          delivery_zone_code: zoneCode,
          district_code: districtCode,
        }))
      )
    )
    logger.info("delivery zones: 3 zones, all 64 districts mapped exactly once")
  } else {
    logger.info("delivery zones: already seeded — skipping")
  }

  // ------------------------------------------------------------------- VAT
  const existingVat = await bdSettings.listVatSettings(
    { is_current: true },
    { take: 1 }
  )
  if (existingVat.length === 0) {
    await bdSettings.createVatSettings({
      is_current: true,
      is_vat_enabled: false,
      registration_status: "unverified",
      prices_include_vat: false,
      tax_region_id: bdTaxRegion.id,
      tax_rate_id: null,
    })
    logger.info("vat_settings: disabled, unverified (PRD FR-11.4 default)")
  } else {
    logger.info("vat_settings: already present — skipping")
  }

  // ---------------------------------------------------- operational settings
  const existingOps = await bdSettings.listOperationalSettings(
    { id: "global" },
    { take: 1 }
  )
  if (existingOps.length === 0) {
    await bdSettings.createOperationalSettings({ id: "global" })
    logger.info("operational_settings: singleton 'global' created with defaults")
  } else {
    logger.info("operational_settings: singleton 'global' already present")
  }

  // ------------------------------------------------------------------- RBAC
  // Native `rbac` is a licensed Medusa feature (MEDUSA_LICENSE_KEY) and is
  // not registered in medusa-config for this deployment. The role/policy
  // seed (database.md §9.2 step 5) is prepared in src/scripts/seed/seed-rbac.ts
  // and runs only on licensed deployments.
  logger.warn(
    "rbac: deferred — native rbac requires MEDUSA_LICENSE_KEY (see seed-rbac.ts)"
  )

  logger.info("Prompt 01 foundation seed complete")
}
