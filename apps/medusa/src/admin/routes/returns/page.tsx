import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ArrowUturnLeft } from "@medusajs/icons"
import { PlaceholderPage } from "../../components/bd/placeholder"

/**
 * Return / refund manual review queue (architecture.md §15.1). 100% human
 * review — never auto-approved (Prompt 08 wires native return + return_review).
 */
export default function ReturnsPage() {
  return (
    <PlaceholderPage
      title="Returns"
      description="Manual return review and refund payout recording. Every request requires human verification; refunds are never automatic."
      prompt="Prompt 08 (returns & refunds)"
      icon={<ArrowUturnLeft />}
    />
  )
}

export const config = defineRouteConfig({
  label: "Returns",
  icon: ArrowUturnLeft,
  rank: 13,
})
