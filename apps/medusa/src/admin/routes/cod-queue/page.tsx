import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Phone } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Table,
  Text,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { bdClient } from "../../lib/bd-client"

type CodQueueItem = {
  order_id: string
  display_id: string | number
  created_at: string
  customer_name: string
  phone: string
  delivery_zone: string
  cod_status: "pending_confirmation" | "confirmed" | "escalated" | "canceled" | "expired"
  order_status: string
  total_amount: number
  cod_collectable_paisa: number
  call_attempts_count: number
  last_call_attempt_at: string | null
  cod_expires_at: string | null
  risk: {
    badge: string
    level: string
    success_rate: number | null
    orders_placed: number
    orders_delivered: number
    orders_rto: number
    is_flagged_fraud: boolean
  }
}

type CodQueueResponse = {
  orders: CodQueueItem[]
  count: number
  status_counts: Record<string, number>
}

export default function CodQueuePage() {
  const queryClient = useQueryClient()
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [search, setSearch] = useState<string>("")
  const [activeCallOrder, setActiveCallOrder] = useState<string | null>(null)
  const [callNotes, setCallNotes] = useState<string>("")
  const [callOutcome, setCallOutcome] = useState<string>("no_answer")

  const { data, isLoading } = useQuery<CodQueueResponse>({
    queryKey: ["cod-queue", selectedStatus, search],
    queryFn: () => {
      const params = new URLSearchParams()
      if (selectedStatus !== "all") params.append("status", selectedStatus)
      if (search) params.append("search", search)
      return bdClient.fetch<CodQueueResponse>(`/admin/cod-queue?${params.toString()}`)
    },
  })

  // Action mutation
  const actionMutation = useMutation({
    mutationFn: ({
      orderId,
      action,
      outcome,
      notes,
    }: {
      orderId: string
      action: "confirm" | "call_attempt" | "cancel"
      outcome?: string
      notes?: string
    }) =>
      bdClient.post(`/admin/orders/${orderId}/cod`, {
        action,
        outcome,
        notes,
      }),
    onSuccess: (_, vars) => {
      toast.success(
        vars.action === "confirm"
          ? "Order Confirmed & Ready to Ship"
          : vars.action === "cancel"
          ? "Order Canceled & Stock Released"
          : "Call Attempt Logged"
      )
      setActiveCallOrder(null)
      setCallNotes("")
      queryClient.invalidateQueries({ queryKey: ["cod-queue"] })
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to perform COD action")
    },
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge color="green">Confirmed</Badge>
      case "escalated":
        return <Badge color="red">Escalated</Badge>
      case "canceled":
        return <Badge color="grey">Canceled</Badge>
      case "expired":
        return <Badge color="purple">Expired</Badge>
      case "pending_confirmation":
      default:
        return <Badge color="orange">Unconfirmed</Badge>
    }
  }

  const getRiskBadge = (risk: CodQueueItem["risk"]) => {
    if (risk.is_flagged_fraud) {
      return <Badge color="red">Fraud Alert</Badge>
    }
    if (risk.orders_rto >= 2) {
      return <Badge color="red">{risk.badge}</Badge>
    }
    if (risk.orders_delivered >= 3 && risk.orders_rto === 0) {
      return <Badge color="green">{risk.badge}</Badge>
    }
    return <Badge color="blue">{risk.badge}</Badge>
  }

  return (
    <Container className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Heading level="h1">COD Verification Queue</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Call center verification queue for Cash on Delivery orders (PRD §6.6, Architecture §9.2).
          </Text>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Search phone or order..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-ui-border-base pb-3">
        {[
          { key: "all", label: "All Orders", count: data?.count ?? 0 },
          { key: "pending_confirmation", label: "Unconfirmed", count: data?.status_counts?.pending_confirmation ?? 0 },
          { key: "escalated", label: "Escalated", count: data?.status_counts?.escalated ?? 0 },
          { key: "confirmed", label: "Confirmed", count: data?.status_counts?.confirmed ?? 0 },
          { key: "canceled", label: "Canceled", count: data?.status_counts?.canceled ?? 0 },
        ].map((tab) => (
          <Button
            key={tab.key}
            size="small"
            variant={selectedStatus === tab.key ? "primary" : "secondary"}
            onClick={() => setSelectedStatus(tab.key)}
          >
            {tab.label} ({tab.count})
          </Button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="py-12 text-center text-ui-fg-subtle">Loading COD queue...</div>
      ) : !data?.orders || data.orders.length === 0 ? (
        <div className="py-12 text-center text-ui-fg-subtle">No orders in this queue.</div>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Order</Table.HeaderCell>
              <Table.HeaderCell>Customer & Phone</Table.HeaderCell>
              <Table.HeaderCell>Zone</Table.HeaderCell>
              <Table.HeaderCell>Collectable (৳)</Table.HeaderCell>
              <Table.HeaderCell>COD Status</Table.HeaderCell>
              <Table.HeaderCell>Risk Profile</Table.HeaderCell>
              <Table.HeaderCell>Calls</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data.orders.map((item) => (
              <Table.Row key={item.order_id}>
                <Table.Cell>
                  <a
                    href={`/app/orders/${item.order_id}`}
                    className="font-medium text-ui-fg-interactive hover:underline"
                  >
                    #{item.display_id}
                  </a>
                  <div className="text-xs text-ui-fg-muted">
                    {new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <div className="font-medium">{item.customer_name}</div>
                  <a href={`tel:${item.phone}`} className="text-xs text-ui-fg-interactive hover:underline">
                    {item.phone}
                  </a>
                </Table.Cell>
                <Table.Cell>
                  <Badge color="grey">{item.delivery_zone.replace("_", " ").toUpperCase()}</Badge>
                </Table.Cell>
                <Table.Cell className="font-semibold">
                  ৳{item.total_amount.toLocaleString()}
                </Table.Cell>
                <Table.Cell>{getStatusBadge(item.cod_status)}</Table.Cell>
                <Table.Cell>{getRiskBadge(item.risk)}</Table.Cell>
                <Table.Cell>
                  <div className="text-sm font-medium">{item.call_attempts_count} / 3</div>
                  {item.call_attempts_count >= 3 && (
                    <span className="text-xs text-ui-fg-error font-semibold">Max Attempts</span>
                  )}
                </Table.Cell>
                <Table.Cell className="text-right space-x-2">
                  {item.cod_status !== "confirmed" && item.cod_status !== "canceled" && (
                    <>
                      <Button
                        size="small"
                        variant="secondary"
                        onClick={() =>
                          actionMutation.mutate({
                            orderId: item.order_id,
                            action: "confirm",
                          })
                        }
                        disabled={actionMutation.isPending}
                      >
                        Confirm
                      </Button>
                      <Button
                        size="small"
                        variant="secondary"
                        onClick={() => {
                          setActiveCallOrder(activeCallOrder === item.order_id ? null : item.order_id)
                        }}
                      >
                        Log Call
                      </Button>
                      <Button
                        size="small"
                        variant="danger"
                        onClick={() => {
                          if (confirm(`Cancel Order #${item.display_id} and release inventory back to stock?`)) {
                            actionMutation.mutate({
                              orderId: item.order_id,
                              action: "cancel",
                              notes: "Canceled from COD queue",
                            })
                          }
                        }}
                        disabled={actionMutation.isPending}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}

      {/* Log Call Modal/Dropdown for active order */}
      {activeCallOrder && (
        <Container className="p-4 border border-ui-border-interactive bg-ui-bg-subtle rounded-lg space-y-3">
          <Heading level="h3">Log Call Attempt for Order #{activeCallOrder}</Heading>
          <div className="flex gap-4">
            <select
              value={callOutcome}
              onChange={(e) => setCallOutcome(e.target.value)}
              className="border border-ui-border-base rounded px-3 py-1.5 text-sm"
            >
              <option value="no_answer">No Answer / Busy</option>
              <option value="reached_confirmed">Reached & Confirmed Order</option>
              <option value="reached_cancel">Reached & Customer Wants Cancel</option>
              <option value="wrong_number">Wrong Number</option>
              <option value="callback_requested">Callback Requested</option>
              <option value="suspicious">Suspicious / Potential Fraud</option>
            </select>
            <Input
              placeholder="Call notes (optional)..."
              value={callNotes}
              onChange={(e) => setCallNotes(e.target.value)}
              className="flex-1"
            />
            <Button
              size="small"
              variant="primary"
              onClick={() => {
                actionMutation.mutate({
                  orderId: activeCallOrder,
                  action: "call_attempt",
                  outcome: callOutcome,
                  notes: callNotes,
                })
              }}
              disabled={actionMutation.isPending}
            >
              Save Call Log
            </Button>
            <Button size="small" variant="secondary" onClick={() => setActiveCallOrder(null)}>
              Dismiss
            </Button>
          </div>
        </Container>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "COD Queue",
  icon: Phone,
  rank: 10,
})
