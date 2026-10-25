import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text } from "@medusajs/ui"

/**
 * Order detail bottom widget — courier booking + finance slot (architecture.md
 * §15.2). Prompt 02 registers the injection point only; the courier booking
 * widget arrives with courier operations (Prompt 07) and the cost/margin
 * breakdown is gated Owner/Finance only when it lands.
 */
export default function OrderCourierBookingWidget() {
  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Courier & Fulfillment</Heading>
      </div>
      <div className="px-6 py-4">
        <Text size="small" className="text-ui-fg-subtle">
          Courier booking (Steadfast / Manual fallback), consignment tracking
          and the shipment state view will appear here (Prompt 07). Shipment
          state is derived from native fulfillment + courier events — it is
          never a single stored status column.
        </Text>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.after",
})
