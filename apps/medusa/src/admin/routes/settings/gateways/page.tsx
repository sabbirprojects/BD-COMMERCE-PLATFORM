import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Bolt } from "@medusajs/icons"
import { PlaceholderPage } from "../../../components/bd/placeholder"

/**
 * bKash / Nagad direct merchant credentials (architecture.md §15.1).
 * Phase 1 payments only: COD + direct bKash + direct Nagad. Secret refs are
 * stored, never plaintext keys (Prompt 12).
 */
export default function SettingsGatewaysPage() {
  return (
    <PlaceholderPage
      title="Payment Gateways"
      description="bKash and Nagad direct merchant API credentials. Secrets are stored as secret_ref + key_version only — never as plaintext, never displayed after save (FR-12.3)."
      prompt="Prompt 12 (payment providers)"
      icon={<Bolt />}
    />
  )
}

export const config = defineRouteConfig({
  label: "Payment Gateways",
  icon: Bolt,
})
