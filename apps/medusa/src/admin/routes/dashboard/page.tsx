import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ArrowPath, BuildingStorefront, ExclamationCircle } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  Heading,
  Table,
  Text,
  toast,
} from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { bdClient } from "../../lib/bd-client"

type DashboardData = {
  success: boolean
  currency: string
  sales_overview: {
    today_orders_count: number
    today_delivered_count: number
    today_gross_sales_bdt: number
    today_net_sales_bdt: number
    today_delivery_collected_bdt: number
    today_courier_cost_bdt: number
  }
  pending_cod_confirmation: {
    count: number
    oldest_unconfirmed_at: string | null
  }
  pending_returns_review: {
    count: number
    oldest_pending_at: string | null
  }
  low_stock_summary: {
    out_of_stock_count: number
    low_stock_count: number
    items: Array<{
      variant_id: string
      product_title: string
      variant_title: string
      sku: string
      stocked_quantity: number
      reserved_quantity: number
      available_quantity: number
    }>
  }
}

export default function DashboardOverviewPage() {
  const { data, isLoading, refetch, error } = useQuery<DashboardData>({
    queryKey: ["admin-reports-dashboard"],
    queryFn: () => bdClient.fetch<DashboardData>("/admin/reports/dashboard"),
    refetchInterval: 60000, // auto-refresh every minute
  })

  const sales = data?.sales_overview
  const cod = data?.pending_cod_confirmation
  const returns = data?.pending_returns_review
  const stock = data?.low_stock_summary

  return (
    <div className="flex flex-col gap-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Heading level="h1">Operations Dashboard</Heading>
          <Text size="small" className="text-ui-fg-subtle mt-1">
            Real-time operational health: today&apos;s sales, pending confirmation queues, and low inventory.
          </Text>
        </div>

        <div className="flex items-center gap-x-2">
          <Button
            variant="secondary"
            size="small"
            onClick={() => {
              refetch()
              toast.info("Dashboard updated")
            }}
          >
            <ArrowPath className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Container className="bg-ui-bg-subtle border-ui-border-error p-4 flex items-center gap-x-2">
          <ExclamationCircle className="text-ui-fg-error w-5 h-5 flex-shrink-0" />
          <Text className="text-ui-fg-error text-sm">
            Failed to load dashboard metrics: {(error as any)?.message || "Server error"}
          </Text>
        </Container>
      )}

      {/* Action Required: Queues Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pending COD Confirmations */}
        <Container className="p-4 border-l-4 border-l-ui-tag-orange-icon flex items-center justify-between">
          <div>
            <div className="flex items-center gap-x-2">
              <Text weight="plus" size="base">
                Pending COD Confirmations
              </Text>
              {(cod?.count || 0) > 0 ? (
                <Badge color="orange" size="small">
                  {cod?.count} Waiting
                </Badge>
              ) : (
                <Badge color="green" size="small">
                  Clear
                </Badge>
              )}
            </div>
            <Text size="xsmall" className="text-ui-fg-subtle mt-1">
              {cod?.oldest_unconfirmed_at
                ? `Oldest awaiting call since: ${new Date(cod.oldest_unconfirmed_at).toLocaleTimeString()}`
                : "No pending orders in call center queue"}
            </Text>
          </div>
          <Button
            size="small"
            variant="secondary"
            onClick={() => {
              window.location.href = "/app/cod-queue"
            }}
          >
            Open Call Queue
          </Button>
        </Container>

        {/* Pending Returns Review */}
        <Container className="p-4 border-l-4 border-l-ui-tag-purple-icon flex items-center justify-between">
          <div>
            <div className="flex items-center gap-x-2">
              <Text weight="plus" size="base">
                Pending Return &amp; Refund Reviews
              </Text>
              {(returns?.count || 0) > 0 ? (
                <Badge color="purple" size="small">
                  {returns?.count} Awaiting Approval
                </Badge>
              ) : (
                <Badge color="green" size="small">
                  Clear
                </Badge>
              )}
            </div>
            <Text size="xsmall" className="text-ui-fg-subtle mt-1">
              {returns?.oldest_pending_at
                ? `Oldest return requested: ${new Date(returns.oldest_pending_at).toLocaleDateString()}`
                : "All customer return requests reviewed"}
            </Text>
          </div>
          <Button
            size="small"
            variant="secondary"
            onClick={() => {
              window.location.href = "/app/returns"
            }}
          >
            Review Returns
          </Button>
        </Container>
      </div>

      {/* Today's Sales Overview Cards */}
      <div>
        <Heading level="h2" className="mb-3 text-base">
          Today&apos;s Store Performance
        </Heading>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Container className="p-4">
            <Text size="small" className="text-ui-fg-subtle font-medium">
              Today&apos;s Orders Placed
            </Text>
            <div className="mt-2 flex items-baseline justify-between">
              <Heading level="h2">
                {sales?.today_orders_count || 0}
              </Heading>
              <Text size="xsmall" className="text-ui-fg-muted">
                {sales?.today_delivered_count || 0} delivered
              </Text>
            </div>
            <Text size="xsmall" className="text-ui-fg-subtle mt-1">
              Orders placed today
            </Text>
          </Container>

          <Container className="p-4">
            <Text size="small" className="text-ui-fg-subtle font-medium">
              Today&apos;s Gross Order Value
            </Text>
            <div className="mt-2 flex items-baseline justify-between">
              <Heading level="h2">
                ৳{(sales?.today_gross_sales_bdt || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </Heading>
            </div>
            <Text size="xsmall" className="text-ui-fg-subtle mt-1">
              Total checkout value before cancellations
            </Text>
          </Container>

          <Container className="p-4">
            <Text size="small" className="text-ui-fg-subtle font-medium">
              Today&apos;s Delivered Sales
            </Text>
            <div className="mt-2 flex items-baseline justify-between">
              <Heading level="h2" className="text-ui-fg-interactive">
                ৳{(sales?.today_net_sales_bdt || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </Heading>
            </div>
            <Text size="xsmall" className="text-ui-fg-subtle mt-1">
              AC-14.2: Excludes cancelled &amp; RTO
            </Text>
          </Container>

          <Container className="p-4">
            <Text size="small" className="text-ui-fg-subtle font-medium">
              Delivery Collected vs Courier Cost
            </Text>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-ui-fg-subtle">Collected:</span>
                <span className="font-mono text-ui-fg-interactive font-medium">
                  +৳{(sales?.today_delivery_collected_bdt || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-ui-fg-subtle">Courier Cost:</span>
                <span className="font-mono text-ui-fg-error font-medium">
                  -৳{(sales?.today_courier_cost_bdt || 0).toFixed(2)}
                </span>
              </div>
            </div>
            <Text size="xsmall" className="text-ui-fg-subtle mt-2">
              FR-14.9: Distinct figures
            </Text>
          </Container>
        </div>
      </div>

      {/* Low Stock Summary */}
      <Container className="p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-ui-border-base flex items-center justify-between">
          <div>
            <div className="flex items-center gap-x-2">
              <Heading level="h2">Inventory Health &amp; Low Stock Alert</Heading>
              {(stock?.out_of_stock_count || 0) > 0 ? (
                <Badge color="red" size="xsmall">
                  {stock?.out_of_stock_count} Out of Stock
                </Badge>
              ) : null}
              {(stock?.low_stock_count || 0) > 0 ? (
                <Badge color="orange" size="xsmall">
                  {stock?.low_stock_count} Low Stock (≤ 10)
                </Badge>
              ) : null}
            </div>
            <Text size="small" className="text-ui-fg-subtle mt-1">
              Variants with available stock ≤ 10 units requiring warehouse restocking.
            </Text>
          </div>

          <Button
            size="small"
            variant="transparent"
            onClick={() => {
              window.location.href = "/app/products"
            }}
          >
            Manage Catalog
          </Button>
        </div>

        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Product</Table.HeaderCell>
              <Table.HeaderCell>Variant</Table.HeaderCell>
              <Table.HeaderCell>SKU</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Stocked</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Reserved</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Available</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {isLoading ? (
              <Table.Row>
                <Table.Cell colSpan={7} className="text-center py-6 text-ui-fg-subtle">
                  Checking inventory levels...
                </Table.Cell>
              </Table.Row>
            ) : !stock?.items || stock.items.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={7} className="text-center py-6 text-ui-fg-subtle">
                  All active product variants have sufficient inventory (&gt; 10 units available).
                </Table.Cell>
              </Table.Row>
            ) : (
              stock.items.map((item) => (
                <Table.Row key={item.variant_id}>
                  <Table.Cell className="font-medium text-xs">
                    {item.product_title}
                  </Table.Cell>
                  <Table.Cell className="text-xs text-ui-fg-subtle">
                    {item.variant_title}
                  </Table.Cell>
                  <Table.Cell className="font-mono text-xs">
                    {item.sku || "—"}
                  </Table.Cell>
                  <Table.Cell className="text-right font-mono text-xs">
                    {item.stocked_quantity}
                  </Table.Cell>
                  <Table.Cell className="text-right font-mono text-xs text-ui-fg-muted">
                    {item.reserved_quantity}
                  </Table.Cell>
                  <Table.Cell className={`text-right font-mono text-xs font-bold ${
                    item.available_quantity <= 0 ? "text-ui-fg-error" : "text-ui-fg-warning"
                  }`}>
                    {item.available_quantity}
                  </Table.Cell>
                  <Table.Cell>
                    {item.available_quantity <= 0 ? (
                      <Badge color="red" size="xsmall">Out of Stock</Badge>
                    ) : (
                      <Badge color="orange" size="xsmall">Low Stock ({item.available_quantity})</Badge>
                    )}
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
  label: "Dashboard",
  icon: BuildingStorefront,
  rank: 1,
})
