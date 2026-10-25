import { defineWidgetConfig, DetailWidgetProps, AdminOrder } from "@medusajs/admin-sdk"
import { Badge, Button, Container, Heading, Input, Text, toast } from "@medusajs/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { bdClient } from "../lib/bd-client"

/**
 * Order detail sidebar widget — COD verification slot (architecture.md §15.2, CHK-ORD-02).
 * Displays customer phone with `tel:` link, RTO risk badge, call attempt logging,
 * and Confirm / Cancel actions.
 */
export default function OrderCodVerificationWidget({
  data: order,
}: DetailWidgetProps<AdminOrder>) {
  const queryClient = useQueryClient()
  const [outcome, setOutcome] = useState<string>("no_answer")
  const [notes, setNotes] = useState<string>("")
  const [showCallBox, setShowCallBox] = useState<boolean>(false)

  const phone = (order as any)?.shipping_address?.phone || ""
  const codDetails = (order as any)?.metadata?.address_snapshot || {}
  const codStatus = (order as any)?.metadata?.cod_status || "pending_confirmation"

  const actionMutation = useMutation({
    mutationFn: ({
      action,
      callOutcome,
      callNotes,
    }: {
      action: "confirm" | "call_attempt" | "cancel"
      callOutcome?: string
      callNotes?: string
    }) =>
      bdClient.post(`/admin/orders/${order.id}/cod`, {
        action,
        outcome: callOutcome,
        notes: callNotes,
      }),
    onSuccess: (_, vars) => {
      toast.success(
        vars.action === "confirm"
          ? "COD Order Confirmed & Ready to Ship"
          : vars.action === "cancel"
          ? "COD Order Canceled & Inventory Released"
          : "Call Attempt Logged"
      )
      setShowCallBox(false)
      setNotes("")
      queryClient.invalidateQueries({ queryKey: ["orders", order.id] })
      queryClient.invalidateQueries({ queryKey: ["cod-queue"] })
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to perform COD action")
    },
  })

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">COD Verification</Heading>
        <Badge
          color={
            codStatus === "confirmed"
              ? "green"
              : codStatus === "escalated"
              ? "red"
              : codStatus === "canceled"
              ? "grey"
              : "orange"
          }
        >
          {codStatus === "confirmed"
            ? "Confirmed"
            : codStatus === "escalated"
            ? "Escalated"
            : codStatus === "canceled"
            ? "Canceled"
            : "Unconfirmed"}
        </Badge>
      </div>

      <div className="px-6 py-4 space-y-4">
        {/* Phone & Call Link */}
        <div>
          <Text size="xsmall" className="text-ui-fg-subtle">
            Customer Phone:
          </Text>
          <div className="flex items-center justify-between mt-1">
            <a
              href={`tel:${phone}`}
              className="text-base font-semibold text-ui-fg-interactive hover:underline"
            >
              {phone || "No phone recorded"}
            </a>
            {phone && (
              <a
                href={`tel:${phone}`}
                className="text-xs px-2.5 py-1 bg-ui-bg-subtle border border-ui-border-base rounded hover:bg-ui-bg-base"
              >
                📞 Call Now
              </a>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {codStatus !== "confirmed" && codStatus !== "canceled" && (
          <div className="space-y-2 pt-2">
            <div className="flex gap-2">
              <Button
                size="small"
                variant="primary"
                className="flex-1"
                onClick={() => actionMutation.mutate({ action: "confirm" })}
                disabled={actionMutation.isPending}
              >
                Confirm Order
              </Button>
              <Button
                size="small"
                variant="secondary"
                onClick={() => setShowCallBox(!showCallBox)}
              >
                Log Call
              </Button>
              <Button
                size="small"
                variant="danger"
                onClick={() => {
                  if (confirm("Are you sure you want to cancel this order and release stock?")) {
                    actionMutation.mutate({ action: "cancel", callNotes: "Canceled from widget" })
                  }
                }}
                disabled={actionMutation.isPending}
              >
                Cancel
              </Button>
            </div>

            {/* Collapsible Call Logging Box */}
            {showCallBox && (
              <div className="p-3 bg-ui-bg-subtle rounded border border-ui-border-base space-y-2 text-xs">
                <Text size="xsmall" className="font-semibold">
                  Record Call Outcome:
                </Text>
                <select
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  className="w-full border border-ui-border-base rounded px-2 py-1 text-xs"
                >
                  <option value="no_answer">No Answer / Busy</option>
                  <option value="reached_confirmed">Reached & Confirmed</option>
                  <option value="reached_cancel">Reached & Wants Cancel</option>
                  <option value="wrong_number">Wrong Number</option>
                  <option value="callback_requested">Callback Requested</option>
                  <option value="suspicious">Suspicious</option>
                </select>
                <Input
                  placeholder="Notes (optional)..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="text-xs"
                />
                <Button
                  size="small"
                  variant="secondary"
                  className="w-full"
                  onClick={() =>
                    actionMutation.mutate({
                      action: "call_attempt",
                      callOutcome: outcome,
                      callNotes: notes,
                    })
                  }
                  disabled={actionMutation.isPending}
                >
                  Save Call Attempt
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.side.before",
})
