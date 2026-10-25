import {
  AuthenticatedMedusaRequest,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import BdSettingsModuleService from "../../../../modules/bd-settings/service"
import { BD_SETTINGS_MODULE } from "../../../../modules/bd-settings"
import { BD_AUDIT_MODULE } from "../../../../modules/bd-audit"
import BdAuditModuleService from "../../../../modules/bd-audit/service"

/**
 * Opt out of the framework's global /admin authenticate middleware so the
 * requireBdRoles guard owns authentication end-to-end and can map every
 * auth failure to 403 (Prompt 02 DONE WHEN). The guard itself calls the
 * same framework `authenticate("user", ["session", "bearer"])` — no auth
 * path is skipped.
 */
export const AUTHENTICATE = false

const MAX_RATE = 1_000_000

type ZoneRateRow = {
  id: string
  code: string
  name_en: string
  name_bn: string
  cod_enabled: boolean
  shipping_option_id: string | null
}

type RateInput = { zone_id: string; amount: number }

type PriceSetWithBdt = {
  id: string
  prices?: { id: string; currency_code: string; amount: number }[]
}

// Core's own link entry point between the fulfillment module's shipping
// option and the pricing module's price set (LINKS.ShippingOptionPriceSet).
const SHIPPING_OPTION_PRICE_SET_LINK = "FulfillmentShippingOptionPricingPriceSetLink"

/**
 * Resolve shipping option → price set (with prices) using the two-step
 * pattern core itself uses: the link rows via remoteQuery (graph traversal
 * from shipping_option does NOT populate price_set in 2.22), then a
 * price_set graph fetch. Returns shipping_option_id → price set with prices.
 */
async function resolvePriceSetsByOption(
  req: MedusaRequest,
  optionIds: string[]
): Promise<Map<string, PriceSetWithBdt>> {
  const result = new Map<string, PriceSetWithBdt>()
  if (optionIds.length === 0) {
    return result
  }

  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)
  // The link alias resolves only through the legacy `service` shape at
  // runtime — the typed `entryPoint` registry does not contain link aliases
  // in 2.22 (core's own set-shipping-options-price-sets step passes
  // `service:` the same way).
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
 * GET /admin/settings/bangladesh — delivery zones with their native
 * shipping-option price (BDT major units, agent.md money boundary).
 * The response is whitelisted: no metadata, no secret refs.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const settings = req.scope.resolve<BdSettingsModuleService>(BD_SETTINGS_MODULE)

  const zones = (await settings.listDeliveryZones({}, {
    order: { priority: "DESC" },
  })) as unknown as ZoneRateRow[]

  const optionIds = zones
    .map((z) => z.shipping_option_id)
    .filter((id): id is string => !!id)
  const priceByOption = await resolvePriceSetsByOption(req, optionIds)

  res.json({
    zones: zones.map((zone) => {
      const priceSet = zone.shipping_option_id
        ? priceByOption.get(zone.shipping_option_id)
        : undefined
      const bdtPrice = priceSet?.prices?.find(
        (p) => p.currency_code === "bdt"
      )
      return {
        id: zone.id,
        code: zone.code,
        name_en: zone.name_en,
        name_bn: zone.name_bn,
        cod_enabled: zone.cod_enabled,
        shipping_option_id: zone.shipping_option_id,
        price_set_id: priceSet?.id ?? null,
        price_id: bdtPrice?.id ?? null,
        amount: bdtPrice?.amount ?? null,
        currency_code: bdtPrice?.currency_code ?? null,
      }
    }),
  })
}

/**
 * POST /admin/settings/bangladesh — save zone display rates into native
 * shipping-option price sets (BDT major units). The custom delivery_zone
 * table never receives a fee column (agent.md money boundary; database.md
 * §3.8.3). Every change is appended to audit_log (FR-12.2).
 */
export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const body = req.body as { rates?: RateInput[] }
  if (!Array.isArray(body?.rates) || body.rates.length === 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Body must contain a non-empty rates array"
    )
  }

  const settings = req.scope.resolve<BdSettingsModuleService>(BD_SETTINGS_MODULE)
  const pricing = req.scope.resolve(Modules.PRICING)

  const normalized = body.rates.map((rate) => {
    const amount = Number(rate.amount)
    if (!Number.isFinite(amount) || amount < 0 || amount > MAX_RATE) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Invalid rate for zone ${rate.zone_id}: must be a BDT amount between 0 and ${MAX_RATE}`
      )
    }
    return { zone_id: rate.zone_id, amount: Number(amount.toFixed(2)) }
  })

  const zones = (await settings.listDeliveryZones({})) as unknown as ZoneRateRow[]
  const zoneById = new Map(zones.map((z) => [z.id, z]))

  const audit = req.scope.resolve<BdAuditModuleService>(BD_AUDIT_MODULE)
  const actorId = req.auth_context?.actor_id ?? "system"
  const updated: { zone: string; amount: number }[] = []

  for (const rate of normalized) {
    const zone = zoneById.get(rate.zone_id)
    if (!zone) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Unknown delivery zone: ${rate.zone_id}`
      )
    }
    if (!zone.shipping_option_id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Zone ${zone.code} has no native shipping option linked`
      )
    }

    const priceByOption = await resolvePriceSetsByOption(req, [
      zone.shipping_option_id,
    ])
    const priceSet = priceByOption.get(zone.shipping_option_id)

    if (!priceSet?.id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Zone ${zone.code} shipping option has no price set`
      )
    }

    const bdtPrice = priceSet.prices?.find((p) => p.currency_code === "bdt")

    await pricing.updatePriceSets(priceSet.id, {
      // CreatePricesDTO requires currency_code even when updating an
      // existing price by id — we only ever touch the BDT price here.
      prices: bdtPrice
        ? [{ id: bdtPrice.id, currency_code: "bdt", amount: rate.amount }]
        : [{ currency_code: "bdt", amount: rate.amount }],
    })

    await audit.appendAuditLog({
      occurred_at: new Date(),
      actor_id: actorId,
      actor_type: "user",
      entity_type: "delivery_zone",
      entity_id: zone.id,
      entity_label: zone.code,
      action: "delivery_rate_updated",
      after_redacted: { amount_bdt: rate.amount },
      request_id: req.requestId,
    })

    updated.push({ zone: zone.code, amount: rate.amount })
  }

  res.json({ saved: updated })
}
