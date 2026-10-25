export interface ContributionProfitSummary {
  report_label: "Contribution Profit" | "Estimated Contribution Profit"
  currency: string
  total_orders: number
  delivered_orders_count: number
  gross_sales_bdt: number
  discount_bdt: number
  net_sales_bdt: number
  customer_paid_delivery_bdt: number // FR-14.9 Column 1
  courier_cost_bdt: number // FR-14.9 Column 2
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

export interface ContributionProfitOrderRow {
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

export interface CodSettlementSummary {
  total_orders: number
  cod_collectable_bdt: number
  customer_paid_delivery_bdt: number // FR-14.9 Column 1
  courier_cost_bdt: number // FR-14.9 Column 2
  cod_collected_bdt: number
  remitted_bdt: number
  courier_fees_bdt: number
  cod_fees_bdt: number
  variance_bdt: number
  pending_count: number
  settled_count: number
  disputed_count: number
}

export interface CodSettlementRow {
  order_id: string
  display_id: number
  created_at: string
  courier_code: string | null
  courier_tracking_code: string | null
  consignment_id: string | null
  cod_status: string
  cod_settlement_status: string
  customer_paid_delivery_bdt: number
  courier_cost_bdt: number
  cod_collectable_bdt: number
  cod_collected_bdt: number
  remitted_bdt: number
  cod_fee_bdt: number
  variance_bdt: number
  variance_reason_code: string | null
  dispute_status: string
  batch_id: string | null
  batch_ref: string | null
}

export interface MetaAttributionComparison {
  platform: "meta"
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
  campaigns: Array<{
    id: string
    name: string
    status: string
    total_spend_bdt: number
    spend_updated_at: string | null
    store_orders_count: number
    store_net_revenue_bdt: number
    meta_events_count: number
  }>
}

export interface DashboardOverview {
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
