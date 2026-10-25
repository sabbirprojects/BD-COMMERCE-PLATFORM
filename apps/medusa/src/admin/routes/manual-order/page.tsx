import { defineRouteConfig } from "@medusajs/admin-sdk"
import { DocumentText } from "@medusajs/icons"
import { PlaceholderPage } from "../../components/bd/placeholder"

/**
 * Phone-first Bangladesh manual order creation (architecture.md §15.3).
 * Draft-order-based flow lands in Prompt 06 — shell reserves the route.
 */
export default function ManualOrderPage() {
  return (
    <PlaceholderPage
      title="Manual Order"
      description="Phone-first manual order creation with 4-tier address entry, zone-based delivery fee and COD / manual online payment."
      prompt="Prompt 06 (manual order flow)"
      icon={<DocumentText />}
    />
  )
}

export const config = defineRouteConfig({
  label: "Manual Order",
  icon: DocumentText,
  rank: 11,
})
