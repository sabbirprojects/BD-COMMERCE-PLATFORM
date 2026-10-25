import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Sparkles } from "@medusajs/icons"
import { PlaceholderPage } from "../../components/bd/placeholder"

/**
 * Campaign landing page builder (architecture.md §15.1) — block builder,
 * versioning and Mode B checkout land in Prompt 09 (bd-campaigns).
 */
export default function LandingPagesPage() {
  return (
    <PlaceholderPage
      title="Landing Pages"
      description="Reusable campaign landing page builder with versioning, rollback and Mode B direct checkout bound to the unified cart."
      prompt="Prompt 09 (campaign landing pages)"
      icon={<Sparkles />}
    />
  )
}

export const config = defineRouteConfig({
  label: "Landing Pages",
  icon: Sparkles,
  rank: 20,
})
