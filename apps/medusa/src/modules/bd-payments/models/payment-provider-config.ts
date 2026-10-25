import { model } from "@medusajs/framework/utils"

/**
 * payment_provider_config
 *
 * Implements database.md §3.7.1:
 * - Configuration for local payment methods: 'cod', 'bkash', 'nagad'
 * - Public metadata and feature flags
 * - Zero credentials rule (DB-S-04): API keys/secrets are never stored in this table.
 *   Stored in secrets manager/env and referenced via secret_ref.
 */
const PaymentProviderConfig = model.define("payment_provider_config", {
  id: model.id({ prefix: "paycfg" }).primaryKey(),
  provider_code: model.text().unique(),
  display_name_en: model.text(),
  display_name_bn: model.text(),
  kind: model.enum(["cod", "mobile_wallet", "card", "bank"]).default("mobile_wallet"),
  is_enabled: model.boolean().default(false),
  is_sandbox: model.boolean().default(true),
  merchant_id: model.text().nullable(),
  secret_ref: model.text().nullable(),
  key_version: model.text().nullable(),
  last_rotated_at: model.dateTime().nullable(),
  supports_refund_api: model.boolean().default(false),
  supports_partial_refund: model.boolean().default(false),
  fee_percent: model.float().default(0),
  fee_fixed_paisa: model.bigNumber().default(0),
  sort_order: model.number().default(0),
  metadata: model.json().nullable(),
})

export default PaymentProviderConfig
