import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Newspaper } from "@medusajs/icons"
import { PlaceholderPage } from "../../../components/bd/placeholder"

/**
 * Policy pages CMS (architecture.md §15.1) — draft/publish/rollback policy
 * pages land in Prompt 09 (FR-9.5).
 */
export default function ContentPagesPage() {
  return (
    <PlaceholderPage
      title="Policy Pages"
      description="Policy and informational pages (About, FAQ, Privacy, Terms, Shipping, Return/Refund Policy) with draft and publish states (FR-9.5)."
      prompt="Prompt 09 (content management)"
      icon={<Newspaper />}
    />
  )
}

export const config = defineRouteConfig({
  label: "Policy Pages",
  icon: Newspaper,
  rank: 22,
})
