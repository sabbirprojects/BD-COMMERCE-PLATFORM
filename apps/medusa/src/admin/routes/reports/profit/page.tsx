import { defineRouteConfig } from "@medusajs/admin-sdk"
import { InformationCircle, Receipt, ArrowPath } from "@medusajs/icons"
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

type ContributionSummary = {
  report_label: "Contribution Profit" | "Estimated Contribution Profit"
  currency: string
  total_orders: number
  delivered_orders_count: number
  gross_sales_bdt: number
  discount_bdt: number
  net_sales_bdt: number
  customer_paid_delivery_bdt: number
  courier_cost_bdt: number
  cogs_bdt: number
  packaging_cost_bdt: number
  payment_fee_bdt: number
  cod_fee_bdt: number
  rto_cost_bdt: number
  returns_cost_bdt: number
  allocated_ad_spend_bdt: number
  contribution_before_ads_bdt: number
  contribution_after_ads_bdt: number
  has_missing_inputs: boolean
  missing_inputs: string[]
}

type OrderRow = {
  order_id: string
  display_id: number
  created_at: string
  order_status: string
  shipment_state: string
  cod_status: string
  is_delivered: boolean
  gross_sales_bdt: number
  discount_bdt: number
  net_sales_bdt: number
  customer_paid_delivery_bdt: number
  courier_cost_bdt: number | null
  cogs_bdt: number | null
  packaging_cost_bdt: number | null
  payment_fee_bdt: number
  cod_fee_bdt: number
  rto_cost_bdt: number
  returns_cost_bdt: number
  contribution_profit_bdt: number
  missing_inputs: string[]
  report_label: string
  utm_campaign: string | null
}

type ContributionReportResponse = {
  success: boolean
  report_label: string
  currency: string
  summary: ContributionSummary
  orders: OrderRow[]
  total_orders_count: number
}

type AttributionResponse = {
  success: boolean
  report_label: string
  platform: string
  sync_status: "connected" | "not_connected" | "failed"
  last_sync_at: string | null
  sync_error_message: string | null
  metrics: {
    manual_campaign_spend_bdt: number
    meta_attributed_purchases_count: number
    store_verified_orders_count: number
    store_verified_revenue_bdt: number
    cost_per_attributed_purchase_bdt: number | null
    cost_per_verified_order_bdt: number | null
  }
}

export default function ReportsProfitPage() {
  const [activeTab, setActiveTab] = useState<"profit" | "attribution">("profit")
  const [from, setFrom] = useState<string>("")
  const [to, setTo] = useState<string>("")
  const [utmSource, setUtmSource] = useState<string>("")

  // Fetch Contribution Profit Report
  const {
    data: profitData,
    isLoading: isProfitLoading,
    refetch: refetchProfit,
    error: profitError,
  } = useQuery<ContributionReportResponse>({
    queryKey: ["admin-reports-contribution-profit", from, to, utmSource],
    queryFn: () => {
      const params = new URLSearchParams()
      if (from) params.append("from", from)
      if (to) params.append("to", to)
      if (utmSource) params.append("utm_source", utmSource)
      return bdClient.fetch<ContributionReportResponse>(
        `/admin/reports/contribution-profit?${params.toString()}`
      )
    },
  })

  // Fetch Marketing Attribution Comparison Report
  const {
    data: attrData,
    isLoading: isAttrLoading,
    refetch: refetchAttr,
  } = useQuery<AttributionResponse>({
    queryKey: ["admin-reports-attribution"],
    queryFn: () => bdClient.fetch<AttributionResponse>("/admin/reports/attribution"),
    enabled: activeTab === "attribution",
  })

  const summary = profitData?.summary

  return (
    <div className="flex flex-col gap-y-4 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-x-3">
            <Heading level="h1">
              {summary?.report_label || "Contribution Profit"}
            </Heading>
            {summary?.has_missing_inputs ? (
              <Badge color="orange" size="small">
                Estimated (Missing Inputs)
              </Badge>
            ) : (
              <Badge color="green" size="small">
                Contribution Profit
              </Badge>
            )}
          </div>
          <Text size="small" className="text-ui-fg-subtle mt-1">
            Reconciles delivered sales, COGS, customer delivery collected vs courier costs, and ad spend estimates.
          </Text>
        </div>

        {/* Tab Switcher & Refresh */}
        <div className="flex items-center gap-x-2">
          <div className="flex bg-ui-bg-subtle p-1 rounded-md">
            <button
              type="button"
              onClick={() => setActiveTab("profit")}
              className={`px-3 py-1 text-xs font-medium rounded ${
                activeTab === "profit"
                  ? "bg-ui-bg-base text-ui-fg-base shadow-sm"
                  : "text-ui-fg-subtle hover:text-ui-fg-base"
              }`}
            >
              Contribution Profit
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("attribution")}
              className={`px-3 py-1 text-xs font-medium rounded ${
                activeTab === "attribution"
                  ? "bg-ui-bg-base text-ui-fg-base shadow-sm"
                  : "text-ui-fg-subtle hover:text-ui-fg-base"
              }`}
            >
              Attribution vs Store
            </button>
          </div>

          <Button
            variant="secondary"
            size="small"
            onClick={() => {
              if (activeTab === "profit") refetchProfit()
              else refetchAttr()
              toast.info("Report refreshed")
            }}
          >
            <ArrowPath className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {profitError && (
        <Container className="bg-ui-bg-subtle border-ui-border-error p-4">
          <Text className="text-ui-fg-error">
            Failed to load report: {(profitError as any)?.message || "Access denied or server error."}
          </Text>
        </Container>
      )}

      {/* Missing inputs warning banner (AC-14.1) */}
      {summary?.has_missing_inputs && (
        <Container className="bg-ui-tag-orange-bg border-ui-tag-orange-border p-4 flex items-start gap-x-3">
          <InformationCircle className="text-ui-tag-orange-icon w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <Text weight="plus" className="text-ui-fg-base">
              Report Labeled: &ldquo;Estimated Contribution Profit&rdquo;
            </Text>
            <Text size="small" className="text-ui-fg-subtle mt-0.5">
              Cost inputs are missing for some orders (missing:{" "}
              <span className="font-mono font-medium">
                {summary.missing_inputs.join(", ")}
              </span>
              ). Per AC-14.1, missing costs are treated as null (not zero), and this report is strictly labeled as an estimate.
            </Text>
          </div>
        </Container>
      )}

      {activeTab === "profit" && (
        <>
          {/* Summary KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Delivered Net Sales (AC-14.2) */}
            <Container className="p-4">
              <Text size="small" className="text-ui-fg-subtle font-medium">
                Delivered Net Sales
              </Text>
              <div className="mt-2 flex items-baseline justify-between">
                <Heading level="h2">
                  ৳{(summary?.net_sales_bdt || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </Heading>
                <Text size="xsmall" className="text-ui-fg-muted">
                  {summary?.delivered_orders_count || 0} / {summary?.total_orders || 0} orders
                </Text>
              </div>
              <Text size="xsmall" className="text-ui-fg-subtle mt-1">
                Excludes cancelled &amp; RTO orders
              </Text>
            </Container>

            {/* Delivery Collected (Customer Paid) - FR-14.9 */}
            <Container className="p-4">
              <Text size="small" className="text-ui-fg-subtle font-medium">
                Delivery Collected (Customer)
              </Text>
              <div className="mt-2 flex items-baseline justify-between">
                <Heading level="h2" className="text-ui-fg-interactive">
                  +৳{(summary?.customer_paid_delivery_bdt || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </Heading>
                <Badge color="blue" size="xsmall">Revenue</Badge>
              </div>
              <Text size="xsmall" className="text-ui-fg-subtle mt-1">
                Paid by customer at checkout
              </Text>
            </Container>

            {/* Courier Cost (Charged to Business) - FR-14.9 */}
            <Container className="p-4">
              <Text size="small" className="text-ui-fg-subtle font-medium">
                Courier Cost (Business Expense)
              </Text>
              <div className="mt-2 flex items-baseline justify-between">
                <Heading level="h2" className="text-ui-fg-error">
                  -৳{(summary?.courier_cost_bdt || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </Heading>
                <Badge color="red" size="xsmall">Expense</Badge>
              </div>
              <Text size="xsmall" className="text-ui-fg-subtle mt-1">
                Includes courier fees on RTO/cancelled
              </Text>
            </Container>

            {/* COGS (Product Cost) */}
            <Container className="p-4">
              <Text size="small" className="text-ui-fg-subtle font-medium">
                Total COGS
              </Text>
              <div className="mt-2 flex items-baseline justify-between">
                <Heading level="h2" className="text-ui-fg-muted">
                  -৳{(summary?.cogs_bdt || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </Heading>
                <Badge color="grey" size="xsmall">Cost</Badge>
              </div>
              <Text size="xsmall" className="text-ui-fg-subtle mt-1">
                Product inventory base cost
              </Text>
            </Container>

            {/* Operational & Gateway Fees */}
            <Container className="p-4">
              <Text size="small" className="text-ui-fg-subtle font-medium">
                Packaging &amp; Gateway Fees
              </Text>
              <div className="mt-2 flex items-baseline justify-between">
                <Heading level="h2" className="text-ui-fg-muted">
                  -৳{(
                    (summary?.packaging_cost_bdt || 0) +
                    (summary?.payment_fee_bdt || 0) +
                    (summary?.cod_fee_bdt || 0)
                  ).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </Heading>
                <Text size="xsmall" className="text-ui-fg-muted">
                  Pkg + bKash/COD
                </Text>
              </div>
              <Text size="xsmall" className="text-ui-fg-subtle mt-1">
                Payment fees &amp; packaging boxes
              </Text>
            </Container>

            {/* RTO & Returns Cost */}
            <Container className="p-4">
              <Text size="small" className="text-ui-fg-subtle font-medium">
                RTO &amp; Approved Returns
              </Text>
              <div className="mt-2 flex items-baseline justify-between">
                <Heading level="h2" className="text-ui-fg-error">
                  -৳{(
                    (summary?.rto_cost_bdt || 0) +
                    (summary?.returns_cost_bdt || 0)
                  ).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </Heading>
                <Badge color="orange" size="xsmall">Return / RTO</Badge>
              </div>
              <Text size="xsmall" className="text-ui-fg-subtle mt-1">
                Refunds &amp; return courier charges
              </Text>
            </Container>

            {/* Contribution Profit (Before Ads) */}
            <Container className="p-4 border-ui-border-interactive">
              <Text size="small" className="text-ui-fg-subtle font-medium">
                Contribution (Before Ads)
              </Text>
              <div className="mt-2 flex items-baseline justify-between">
                <Heading level="h2" className={
                  (summary?.contribution_before_ads_bdt || 0) >= 0 ? "text-ui-fg-interactive" : "text-ui-fg-error"
                }>
                  ৳{(summary?.contribution_before_ads_bdt || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </Heading>
              </div>
              <Text size="xsmall" className="text-ui-fg-subtle mt-1">
                Operating margin before ad marketing
              </Text>
            </Container>

            {/* Contribution Profit (After Ad Spend Estimate) */}
            <Container className="p-4 bg-ui-bg-subtle">
              <div className="flex items-center justify-between">
                <Text size="small" className="text-ui-fg-subtle font-medium">
                  Contribution (After Ads)
                </Text>
                <Badge color="purple" size="xsmall">Est. Ads</Badge>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <Heading level="h2" className={
                  (summary?.contribution_after_ads_bdt || 0) >= 0 ? "text-ui-fg-base" : "text-ui-fg-error"
                }>
                  ৳{(summary?.contribution_after_ads_bdt || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </Heading>
                <Text size="xsmall" className="text-ui-fg-muted">
                  Ad: ৳{(summary?.allocated_ad_spend_bdt || 0).toFixed(0)}
                </Text>
              </div>
              <Text size="xsmall" className="text-ui-fg-subtle mt-1">
                Ad spend labeled as estimate (FR-14.7)
              </Text>
            </Container>
          </div>

          {/* Filters Bar */}
          <Container className="p-4 flex flex-wrap items-center gap-4">
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
            <div className="flex items-center gap-x-2">
              <Text size="small" className="text-ui-fg-subtle">UTM Source:</Text>
              <Input
                placeholder="e.g. facebook, google"
                size="small"
                value={utmSource}
                onChange={(e) => setUtmSource(e.target.value)}
              />
            </div>
            {(from || to || utmSource) && (
              <Button
                variant="transparent"
                size="small"
                onClick={() => {
                  setFrom("")
                  setTo("")
                  setUtmSource("")
                }}
              >
                Clear Filters
              </Button>
            )}
          </Container>

          {/* Orders Breakdown Table */}
          <Container className="p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-ui-border-base flex items-center justify-between">
              <Heading level="h2">Orders Breakdown</Heading>
              <Text size="small" className="text-ui-fg-subtle">
                Showing {profitData?.orders?.length || 0} of {profitData?.total_orders_count || 0} orders
              </Text>
            </div>

            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Order</Table.HeaderCell>
                  <Table.HeaderCell>Date</Table.HeaderCell>
                  <Table.HeaderCell>Status</Table.HeaderCell>
                  <Table.HeaderCell className="text-right">Net Sales (৳)</Table.HeaderCell>
                  <Table.HeaderCell className="text-right">Delivery Collected (৳)</Table.HeaderCell>
                  <Table.HeaderCell className="text-right">Courier Cost (৳)</Table.HeaderCell>
                  <Table.HeaderCell className="text-right">COGS (৳)</Table.HeaderCell>
                  <Table.HeaderCell className="text-right">Contribution (৳)</Table.HeaderCell>
                  <Table.HeaderCell>Label</Table.HeaderCell>
                </Table.Row>
              </Table.Header>

              <Table.Body>
                {isProfitLoading ? (
                  <Table.Row>
                    <Table.Cell colSpan={9} className="text-center py-8 text-ui-fg-subtle">
                      Loading contribution profit rows...
                    </Table.Cell>
                  </Table.Row>
                ) : profitData?.orders?.length === 0 ? (
                  <Table.Row>
                    <Table.Cell colSpan={9} className="text-center py-8 text-ui-fg-subtle">
                      No order data found for the selected period.
                    </Table.Cell>
                  </Table.Row>
                ) : (
                  profitData?.orders?.map((row) => (
                    <Table.Row key={row.order_id}>
                      <Table.Cell className="font-medium font-mono">
                        #{row.display_id}
                      </Table.Cell>
                      <Table.Cell className="text-ui-fg-subtle text-xs">
                        {new Date(row.created_at).toLocaleDateString()}
                      </Table.Cell>
                      <Table.Cell>
                        <Badge
                          size="xsmall"
                          color={
                            row.is_delivered
                              ? "green"
                              : row.order_status === "canceled"
                              ? "red"
                              : "grey"
                          }
                        >
                          {row.is_delivered ? "Delivered" : row.order_status}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell className="text-right font-mono text-xs">
                        ৳{row.net_sales_bdt.toFixed(2)}
                      </Table.Cell>
                      <Table.Cell className="text-right font-mono text-xs text-ui-fg-interactive">
                        ৳{row.customer_paid_delivery_bdt.toFixed(2)}
                      </Table.Cell>
                      <Table.Cell className="text-right font-mono text-xs text-ui-fg-error">
                        {row.courier_cost_bdt !== null
                          ? `৳${row.courier_cost_bdt.toFixed(2)}`
                          : <span className="text-ui-fg-muted italic">null</span>}
                      </Table.Cell>
                      <Table.Cell className="text-right font-mono text-xs">
                        {row.cogs_bdt !== null
                          ? `৳${row.cogs_bdt.toFixed(2)}`
                          : <span className="text-ui-fg-muted italic">null</span>}
                      </Table.Cell>
                      <Table.Cell className={`text-right font-mono text-xs font-semibold ${
                        row.contribution_profit_bdt >= 0 ? "text-ui-fg-base" : "text-ui-fg-error"
                      }`}>
                        ৳{row.contribution_profit_bdt.toFixed(2)}
                      </Table.Cell>
                      <Table.Cell>
                        {row.missing_inputs?.length > 0 ? (
                          <Badge color="orange" size="xsmall">
                            Est ({row.missing_inputs.join(", ")})
                          </Badge>
                        ) : (
                          <Badge color="grey" size="xsmall">
                            Contribution
                          </Badge>
                        )}
                      </Table.Cell>
                    </Table.Row>
                  ))
                )}
              </Table.Body>
            </Table>
          </Container>
        </>
      )}

      {/* Attribution vs Store Sales Tab (FR-5.3.5 & FR-5.3.6) */}
      {activeTab === "attribution" && (
        <div className="flex flex-col gap-y-4">
          {/* Sync Status Banner */}
          <Container className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-x-3">
              <Badge
                color={
                  attrData?.sync_status === "connected"
                    ? "green"
                    : attrData?.sync_status === "failed"
                    ? "red"
                    : "orange"
                }
              >
                {attrData?.sync_status === "connected"
                  ? "Connected"
                  : attrData?.sync_status === "failed"
                  ? "Sync Failed"
                  : "Not Connected"}
              </Badge>
              <div>
                <Text weight="plus" size="small">
                  Meta Marketing API Integration
                </Text>
                <Text size="xsmall" className="text-ui-fg-subtle">
                  {attrData?.sync_error_message ||
                    `Last synced: ${
                      attrData?.last_sync_at
                        ? new Date(attrData.last_sync_at).toLocaleString()
                        : "Never"
                    }`}
                </Text>
              </div>
            </div>
            <Text size="xsmall" className="text-ui-fg-muted">
              FR-5.3.6: Missing spend is never defaulted to zero.
            </Text>
          </Container>

          {/* Metrics Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Container className="p-4">
              <Text size="small" className="text-ui-fg-subtle font-medium">
                Manual Campaign Spend (Estimate)
              </Text>
              <Heading level="h2" className="mt-2 text-ui-fg-purple">
                ৳{(attrData?.metrics.manual_campaign_spend_bdt || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </Heading>
              <Text size="xsmall" className="text-ui-fg-subtle mt-1">
                Recorded manually against active ad campaigns
              </Text>
            </Container>

            <Container className="p-4">
              <Text size="small" className="text-ui-fg-subtle font-medium">
                Meta Pixel Purchases
              </Text>
              <Heading level="h2" className="mt-2 text-ui-fg-interactive">
                {attrData?.metrics.meta_attributed_purchases_count || 0}
              </Heading>
              <Text size="xsmall" className="text-ui-fg-subtle mt-1">
                Cost / Meta Purchase:{" "}
                {attrData?.metrics.cost_per_attributed_purchase_bdt !== null
                  ? `৳${attrData?.metrics.cost_per_attributed_purchase_bdt}`
                  : "N/A"}
              </Text>
            </Container>

            <Container className="p-4">
              <Text size="small" className="text-ui-fg-subtle font-medium">
                Store-Verified Orders
              </Text>
              <Heading level="h2" className="mt-2 text-ui-fg-success">
                {attrData?.metrics.store_verified_orders_count || 0}
              </Heading>
              <Text size="xsmall" className="text-ui-fg-subtle mt-1">
                Cost / Verified Order:{" "}
                {attrData?.metrics.cost_per_verified_order_bdt !== null
                  ? `৳${attrData?.metrics.cost_per_verified_order_bdt}`
                  : "N/A"}
              </Text>
            </Container>
          </div>
        </div>
      )}
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Contribution Profit",
  icon: Receipt,
  rank: 30,
})
