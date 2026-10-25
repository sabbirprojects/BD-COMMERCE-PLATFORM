import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Receipt } from "@medusajs/icons"
import { PlaceholderPage } from "../../../components/bd/placeholder"

/**
 * Invoice templates (architecture.md §15.1, FR-11.7). Immutable fiscal-year
 * invoices from order-time snapshots land in Prompt 13.
 */
export default function SettingsInvoicesPage() {
  return (
    <PlaceholderPage
      title="Invoices"
      description="Printable invoice templates and logo upload. Invoices are generated from write-once order-time financial snapshots (fiscal year serial INV-2026-27-000001)."
      prompt="Prompt 13 (invoicing & PDF)"
      icon={<Receipt />}
    />
  )
}

export const config = defineRouteConfig({
  label: "Invoices",
  icon: Receipt,
})
