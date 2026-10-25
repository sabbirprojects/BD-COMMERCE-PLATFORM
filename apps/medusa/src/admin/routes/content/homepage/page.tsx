import { defineRouteConfig } from "@medusajs/admin-sdk"
import { BuildingStorefront } from "@medusajs/icons"
import { PlaceholderPage } from "../../../components/bd/placeholder"

/**
 * Homepage section builder (architecture.md §15.1) — CMS homepage sections
 * land in Prompt 09 (bd-campaigns CMS tables).
 */
export default function ContentHomepagePage() {
  return (
    <PlaceholderPage
      title="Homepage"
      description="Homepage section builder with reorder, hide and publish controls (FR-9.1)."
      prompt="Prompt 09 (content management)"
      icon={<BuildingStorefront />}
    />
  )
}

export const config = defineRouteConfig({
  label: "Homepage",
  icon: BuildingStorefront,
  rank: 21,
})
