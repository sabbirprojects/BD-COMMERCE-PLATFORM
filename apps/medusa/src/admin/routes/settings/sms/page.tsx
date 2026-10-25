import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Phone } from "@medusajs/icons"
import { PlaceholderPage } from "../../../components/bd/placeholder"

/**
 * SMS gateway settings (architecture.md §15.1, FR-11.6.1). Gateway choice is
 * an Open owner decision (Q#9); the SMS outbox lands in Prompt 10.
 */
export default function SettingsSmsPage() {
  return (
    <PlaceholderPage
      title="SMS"
      description="SMS gateway credentials, sender ID, message templates and delivery log (outbox pattern — native notification + sms_delivery_detail)."
      prompt="Prompt 10 (SMS notifications)"
      icon={<Phone />}
    />
  )
}

export const config = defineRouteConfig({
  label: "SMS",
  icon: Phone,
})
