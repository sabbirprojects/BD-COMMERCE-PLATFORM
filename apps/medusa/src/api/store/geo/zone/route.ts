import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import BdSettingsModuleService from "../../../../modules/bd-settings/service"
import { BD_SETTINGS_MODULE } from "../../../../modules/bd-settings"

const SHIPPING_OPTION_PRICE_SET_LINK = "FulfillmentShippingOptionPricingPriceSetLink"

interface PriceSetWithBdt {
  id: string
  prices?: { id: string; currency_code: string; amount: number }[]
}

async function resolvePriceSetsByOption(
  req: MedusaRequest,
  optionIds: string[]
): Promise<Map<string, PriceSetWithBdt>> {
  const result = new Map<string, PriceSetWithBdt>()
  if (optionIds.length === 0) {
    return result
  }

  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)
  const remoteQueryFn = remoteQuery as unknown as (config: {
    service: string
    variables: { filters: Record<string, unknown> }
    fields: string[]
  }) => Promise<unknown>

  const links = (await remoteQueryFn({
    service: SHIPPING_OPTION_PRICE_SET_LINK,
    variables: { filters: { shipping_option_id: optionIds } },
    fields: ["shipping_option_id", "price_set_id"],
  })) as { shipping_option_id: string; price_set_id: string }[]

  const priceSetIds = [...new Set(links.map((link) => link.price_set_id))]
  if (priceSetIds.length === 0) {
    return result
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: priceSets } = await query.graph({
    entity: "price_set",
    fields: ["id", "prices.id", "prices.currency_code", "prices.amount"],
    filters: { id: priceSetIds },
  })

  const priceSetById = new Map(
    (priceSets as PriceSetWithBdt[]).map((ps) => [ps.id, ps])
  )
  for (const link of links) {
    const priceSet = priceSetById.get(link.price_set_id)
    if (priceSet) {
      result.set(link.shipping_option_id, priceSet)
    }
  }
  return result
}

/**
 * GET /store/geo/zone?district_code=BD-DHK-DHA
 *
 * Resolves delivery zone and current configured shipping option price
 * following: district -> delivery_zone_district -> delivery_zone.shipping_option_id.
 *
 * Requirements:
 * - If district has no valid mapping or shipping option is missing: returns 404 error.
 * - Never fabricates a fallback zone.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const districtCode = req.query.district_code as string | undefined
  if (!districtCode) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Query parameter 'district_code' is required"
    )
  }

  const settings = req.scope.resolve<BdSettingsModuleService>(BD_SETTINGS_MODULE)

  // 1. Resolve district -> delivery_zone_district
  const mappings = await settings.listDeliveryZoneDistricts({
    district_code: districtCode,
  })

  if (!mappings || mappings.length === 0) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `No delivery zone configured for district: ${districtCode}`
    )
  }

  const zoneCode = mappings[0].delivery_zone_code

  // 2. Resolve delivery_zone
  const zones = await settings.listDeliveryZones({ code: zoneCode })
  if (!zones || zones.length === 0) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Delivery zone definition '${zoneCode}' not found`
    )
  }

  const zone = zones[0]
  if (!zone.shipping_option_id) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Zone '${zone.code}' has no native shipping option linked`
    )
  }

  // 3. Resolve live price from native shipping option price set
  const priceMap = await resolvePriceSetsByOption(req, [zone.shipping_option_id])
  const priceSet = priceMap.get(zone.shipping_option_id)
  const bdtPrice = priceSet?.prices?.find((p) => p.currency_code === "bdt")

  if (!bdtPrice) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Shipping option '${zone.shipping_option_id}' has no configured BDT price`
    )
  }

  res.json({
    district_code: districtCode,
    delivery_zone: {
      code: zone.code,
      name_en: zone.name_en,
      name_bn: zone.name_bn,
      shipping_option_id: zone.shipping_option_id,
      amount: bdtPrice.amount,
      currency_code: bdtPrice.currency_code,
      cod_enabled: zone.cod_enabled,
      delivery_days_min: zone.delivery_days_min,
      delivery_days_max: zone.delivery_days_max,
      cod_handling_fee_paisa: zone.cod_handling_fee_paisa || 0,
    },
  })
}
