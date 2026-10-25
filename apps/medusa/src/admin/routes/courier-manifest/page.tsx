import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ArchiveBox } from "@medusajs/icons"
import { PlaceholderPage } from "../../components/bd/placeholder"

/**
 * Courier dispatch manifest (architecture.md §15.1) — bulk consignment
 * creation and thermal label printing land in Prompt 07 (bd-courier).
 */
export default function CourierManifestPage() {
  return (
    <PlaceholderPage
      title="Courier Manifest"
      description="Bulk courier consignment booking, thermal sticker printing and dispatch tracking (Steadfast API with Manual Courier Fallback, O-11)."
      prompt="Prompt 07 (courier integration)"
      icon={<ArchiveBox />}
    />
  )
}

export const config = defineRouteConfig({
  label: "Courier Manifest",
  icon: ArchiveBox,
  rank: 12,
})
