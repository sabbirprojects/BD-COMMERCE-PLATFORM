import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ReceiptPercent } from "@medusajs/icons"
import { PlaceholderPage } from "../../../components/bd/placeholder"

/**
 * COD settlement & remittance reconciliation (architecture.md §15.1) —
 * courier remittance matching lands with courier ops in Prompt 07/11.
 */
export default function ReportsCodSettlementPage() {
  return (
    <PlaceholderPage
      title="COD Settlement"
      description="Courier COD remittance reconciliation — collected amounts vs remitted amounts, per courier and per settlement cycle."
      prompt="Prompt 11 (COD settlement reporting)"
      icon={<ReceiptPercent />}
    />
  )
}

export const config = defineRouteConfig({
  label: "COD Settlement",
  icon: ReceiptPercent,
  rank: 31,
})
