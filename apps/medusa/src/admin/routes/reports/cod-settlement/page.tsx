import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ArrowPath, ReceiptPercent } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Select,
  Table,
  Text,
  toast,
} from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { bdClient } from "../../../lib/bd-client"

type CodSettlementSummary = {
  total_orders: number
  cod_collectable_bdt: number
  customer_paid_delivery_bdt: number
  courier_cost_bdt: number
  cod_collected_bdt: number
  remitted_bdt: number
  courier_fees_bdt: number
  cod_fees_bdt: number
  variance_bdt: number
  pending_count: number
  settled_count: number
  disputed_count: number
}

type CodSettlementRow = {
  order_id: string
  display_id: number
  created_at: string
  courier_code: string | null
  courier_tracking_code: string | null
  consignment_id: string | null
  cod_status: string
  cod_settlement_status: "pending" | "settled" | "disputed"
  customer_paid_delivery_bdt: number
  courier_cost_bdt: number
  cod_collectable_bdt: number
  cod_collected_bdt: number
  remitted_bdt: number
  cod_fee_bdt: number
  variance_bdt: number
  variance_reason_code: string | null
  dispute_status: string | null
  batch_id: string | null
  batch_ref: string | null
}

type CodSettlementResponse = {
  success: boolean
  report_label: string
  currency: string
  summary: CodSettlementSummary
  settlements: CodSettlementRow[]
  total_count: number
}

export default function ReportsCodSettlementPage() {
  const [courierCode, setCourierCode] = useState<string>("all")
  const [settlementStatus, setSettlementStatus] = useState<string>("all")
  const [from, setFrom] = useState<string>("")
  const [to, setTo] = useState<string>("")

  const { data, isLoading, refetch, error } = useQuery<CodSettlementResponse>({
    queryKey: ["admin-reports-cod-settlement", courierCode, settlementStatus, from, to],
    queryFn: () => {
      const params = new URLSearchParams()
      if (courierCode !== "all") params.append("courier_code", courierCode)
      if (settlementStatus !== "all") params.append("settlement_status", settlementStatus)
      if (from) params.append("from", from)
      if (to) params.append("to", to)
      return bdClient.fetch<CodSettlementResponse>(
        `/admin/reports/cod-settlement?${params.toString()}`
      )
    },
  })

  const summary = data?.summary

  return (
    <div className="flex flex-col gap-y-4 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <Heading level="h1">COD Settlement &amp; Courier Remittance</Heading>
          <Text size="small" className="text-ui-fg-subtle mt-1">
            Reconciles courier remittances against collectable amounts, delivery fees, and variances (FR-14.9).
          </Text>
        </div>

        <Button
          variant="secondary"
          size="small"
          onClick={() => {
            refetch()
            toast.info("Settlement report refreshed")
          }}
        >
          <ArrowPath className="w-4 h-4" />
        </Button>
      </div>

      {error && (
        <Container className="bg-ui-bg-subtle border-ui-border-error p-4">
          <Text className="text-ui-fg-error">
            Failed to load settlements: {(error as any)?.message || "Access denied or server error."}
          </Text>
        </Container>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* COD Collectable */}
        <Container className="p-4">
          <Text size="small" className="text-ui-fg-subtle font-medium">
            Total COD Collectable
          </Text>
          <div className="mt-2 flex items-baseline justify-between">
            <Heading level="h2">
              ৳{(summary?.cod_collectable_bdt || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </Heading>
            <Text size="xsmall" className="text-ui-fg-muted">
              {summary?.total_orders || 0} orders
            </Text>
          </div>
          <Text size="xsmall" className="text-ui-fg-subtle mt-1">
            Assigned to courier consignments
          </Text>
        </Container>

        {/* Courier Remitted */}
        <Container className="p-4">
          <Text size="small" className="text-ui-fg-subtle font-medium">
            Remitted by Couriers
          </Text>
          <div className="mt-2 flex items-baseline justify-between">
            <Heading level="h2" className="text-ui-fg-interactive">
              ৳{(summary?.remitted_bdt || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </Heading>
            <Badge color="green" size="xsmall">Received</Badge>
          </div>
          <Text size="xsmall" className="text-ui-fg-subtle mt-1">
            Settled via bank remittance batches
          </Text>
        </Container>

        {/* Separate Delivery Collected vs Courier Cost (FR-14.9) */}
        <Container className="p-4">
          <Text size="small" className="text-ui-fg-subtle font-medium">
            Delivery Collected vs Courier Fee
          </Text>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-ui-fg-subtle">Customer Paid:</span>
              <span className="font-mono text-ui-fg-interactive font-medium">
                +৳{(summary?.customer_paid_delivery_bdt || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-ui-fg-subtle">Courier Charged:</span>
              <span className="font-mono text-ui-fg-error font-medium">
                -৳{(summary?.courier_cost_bdt || 0).toFixed(2)}
              </span>
            </div>
          </div>
          <Text size="xsmall" className="text-ui-fg-subtle mt-2">
            FR-14.9: Distinct separate metrics
          </Text>
        </Container>

        {/* Variance */}
        <Container className="p-4">
          <Text size="small" className="text-ui-fg-subtle font-medium">
            Net Unsettled / Variance
          </Text>
          <div className="mt-2 flex items-baseline justify-between">
            <Heading level="h2" className={
              (summary?.variance_bdt || 0) > 0 ? "text-ui-fg-error" : "text-ui-fg-base"
            }>
              ৳{(summary?.variance_bdt || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </Heading>
            <Badge
              color={(summary?.disputed_count || 0) > 0 ? "red" : "grey"}
              size="xsmall"
            >
              {summary?.disputed_count || 0} Disputed
            </Badge>
          </div>
          <Text size="xsmall" className="text-ui-fg-subtle mt-1">
            Pending: {summary?.pending_count || 0} | Settled: {summary?.settled_count || 0}
          </Text>
        </Container>
      </div>

      {/* Filters Bar */}
      <Container className="p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-x-2">
          <Text size="small" className="text-ui-fg-subtle">Courier:</Text>
          <select
            className="border border-ui-border-base rounded px-2 py-1 text-sm bg-ui-bg-base"
            value={courierCode}
            onChange={(e) => setCourierCode(e.target.value)}
          >
            <option value="all">All Couriers</option>
            <option value="steadfast">Steadfast</option>
            <option value="pathao">Pathao</option>
            <option value="redx">RedX</option>
            <option value="manual">Manual</option>
          </select>
        </div>

        <div className="flex items-center gap-x-2">
          <Text size="small" className="text-ui-fg-subtle">Status:</Text>
          <select
            className="border border-ui-border-base rounded px-2 py-1 text-sm bg-ui-bg-base"
            value={settlementStatus}
            onChange={(e) => setSettlementStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="settled">Settled</option>
            <option value="disputed">Disputed</option>
          </select>
        </div>

        <div className="flex items-center gap-x-2">
          <Text size="small" className="text-ui-fg-subtle">From:</Text>
          <Input
            type="date"
            size="small"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-x-2">
          <Text size="small" className="text-ui-fg-subtle">To:</Text>
          <Input
            type="date"
            size="small"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>

        {(courierCode !== "all" || settlementStatus !== "all" || from || to) && (
          <Button
            variant="transparent"
            size="small"
            onClick={() => {
              setCourierCode("all")
              setSettlementStatus("all")
              setFrom("")
              setTo("")
            }}
          >
            Reset Filters
          </Button>
        )}
      </Container>

      {/* Settlements Table */}
      <Container className="p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-ui-border-base flex items-center justify-between">
          <Heading level="h2">Settlement Lines</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Showing {data?.settlements?.length || 0} of {data?.total_count || 0} orders
          </Text>
        </div>

        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Order</Table.HeaderCell>
              <Table.HeaderCell>Courier &amp; Tracking</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Collectable (৳)</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Remitted (৳)</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Delivery Collected (৳)</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Courier Fee (৳)</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Variance (৳)</Table.HeaderCell>
              <Table.HeaderCell>Batch Ref</Table.HeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {isLoading ? (
              <Table.Row>
                <Table.Cell colSpan={9} className="text-center py-8 text-ui-fg-subtle">
                  Loading settlement records...
                </Table.Cell>
              </Table.Row>
            ) : data?.settlements?.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={9} className="text-center py-8 text-ui-fg-subtle">
                  No settlement records found.
                </Table.Cell>
              </Table.Row>
            ) : (
              data?.settlements?.map((row) => (
                <Table.Row key={row.order_id}>
                  <Table.Cell className="font-medium font-mono">
                    #{row.display_id}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="text-xs">
                      <span className="font-medium capitalize">{row.courier_code || "N/A"}</span>
                      {row.courier_tracking_code && (
                        <span className="text-ui-fg-muted font-mono block">
                          {row.courier_tracking_code}
                        </span>
                      )}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      size="xsmall"
                      color={
                        row.cod_settlement_status === "settled"
                          ? "green"
                          : row.cod_settlement_status === "disputed"
                          ? "red"
                          : "orange"
                      }
                    >
                      {row.cod_settlement_status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell className="text-right font-mono text-xs">
                    ৳{row.cod_collectable_bdt.toFixed(2)}
                  </Table.Cell>
                  <Table.Cell className="text-right font-mono text-xs text-ui-fg-interactive">
                    ৳{row.remitted_bdt.toFixed(2)}
                  </Table.Cell>
                  <Table.Cell className="text-right font-mono text-xs">
                    ৳{row.customer_paid_delivery_bdt.toFixed(2)}
                  </Table.Cell>
                  <Table.Cell className="text-right font-mono text-xs text-ui-fg-error">
                    ৳{row.courier_cost_bdt.toFixed(2)}
                  </Table.Cell>
                  <Table.Cell className={`text-right font-mono text-xs font-semibold ${
                    row.variance_bdt > 0 ? "text-ui-fg-error" : "text-ui-fg-base"
                  }`}>
                    ৳{row.variance_bdt.toFixed(2)}
                  </Table.Cell>
                  <Table.Cell className="text-xs font-mono text-ui-fg-muted">
                    {row.batch_ref || "—"}
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table>
      </Container>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "COD Settlement",
  icon: ReceiptPercent,
  rank: 31,
})
