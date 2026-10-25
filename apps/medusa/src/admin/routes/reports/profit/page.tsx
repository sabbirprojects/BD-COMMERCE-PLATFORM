import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Receipt } from "@medusajs/icons"
import { PlaceholderPage } from "../../../components/bd/placeholder"

/**
 * Contribution profit dashboard (architecture.md §15.1). The term "Net
 * Profit" is forbidden (agent.md §4.10) — this report shows Contribution
 * Profit only, after COGS and ads inputs exist (Prompt 11).
 */
export default function ReportsProfitPage() {
  return (
    <PlaceholderPage
      title="Contribution Profit"
      description="Estimated Contribution Profit reporting — Net Revenue, COGS, shipping subsidies, payment fees and ad spend, before/after ads. Customer delivery fees and courier costs are shown as separate figures (FR-14.9)."
      prompt="Prompt 11 (financial reporting)"
      icon={<Receipt />}
    />
  )
}

export const config = defineRouteConfig({
  label: "Contribution Profit",
  icon: Receipt,
  rank: 30,
})
