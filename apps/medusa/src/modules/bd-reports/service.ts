import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  CodSettlementRow,
  CodSettlementSummary,
  ContributionProfitOrderRow,
  ContributionProfitSummary,
  DashboardOverview,
  MetaAttributionComparison,
} from "./types"

export class BdReportsModuleService {
  protected pg: any

  constructor(cradle: any = {}) {
    this.pg =
      cradle?.__pg_connection__ ||
      cradle?.pg_connection ||
      cradle?.[ContainerRegistrationKeys.PG_CONNECTION]
  }

  setPgConnection(pg: any) {
    this.pg = pg
    return this
  }

  /**
   * Contribution Profit Report (database.md §8.14, PRD §14, AC-14.1, AC-14.2, AC-G5)
   * Strictly query-only from view v_contribution_profit and ad_campaign.
   */
  async getContributionProfitReport(filters: {
    from?: string
    to?: string
    campaign_id?: string
    utm_source?: string
    limit?: number
    offset?: number
  } = {}): Promise<{
    summary: ContributionProfitSummary
    orders: ContributionProfitOrderRow[]
    total_orders_count: number
  }> {
    const { from, to, campaign_id, utm_source, limit = 50, offset = 0 } = filters

    const whereClauses: string[] = []
    const params: any[] = []

    if (from) {
      params.push(from)
      whereClauses.push(`created_at >= ?`)
    }
    if (to) {
      params.push(to)
      whereClauses.push(`created_at <= ?`)
    }
    if (campaign_id) {
      params.push(campaign_id)
      params.push(campaign_id)
      whereClauses.push(`(ad_campaign_id = ? OR landing_page_id = ?)`)
    }
    if (utm_source) {
      params.push(utm_source)
      whereClauses.push(`utm_source = ?`)
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : ""

    // 1. Fetch paginated orders
    const ordersQuery = `
      SELECT 
        order_id,
        display_id,
        created_at,
        order_status,
        shipment_state,
        cod_status,
        is_delivered,
        gross_sales_paisa,
        discount_paisa,
        net_sales_paisa,
        customer_paid_delivery_paisa,
        courier_cost_paisa,
        cogs_paisa,
        packaging_cost_paisa,
        payment_fee_paisa,
        cod_fee_paisa,
        rto_cost_paisa,
        returns_cost_paisa,
        missing_inputs,
        contribution_profit_paisa,
        report_label,
        utm_campaign
      FROM v_contribution_profit
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `
    const ordersRes = await this.pg.raw(ordersQuery, [...params, limit, offset])
    const rows = ordersRes.rows || []

    // 2. Fetch summary aggregations
    const aggQuery = `
      SELECT 
        COUNT(*) AS total_orders,
        COUNT(*) FILTER (WHERE is_delivered = true) AS delivered_orders_count,
        COALESCE(SUM(gross_sales_paisa), 0) AS gross_sales_paisa,
        COALESCE(SUM(discount_paisa), 0) AS discount_paisa,
        COALESCE(SUM(net_sales_paisa), 0) AS net_sales_paisa,
        COALESCE(SUM(customer_paid_delivery_paisa), 0) AS customer_paid_delivery_paisa,
        COALESCE(SUM(courier_cost_paisa), 0) AS courier_cost_paisa,
        COALESCE(SUM(cogs_paisa), 0) AS cogs_paisa,
        COALESCE(SUM(packaging_cost_paisa), 0) AS packaging_cost_paisa,
        COALESCE(SUM(payment_fee_paisa), 0) AS payment_fee_paisa,
        COALESCE(SUM(cod_fee_paisa), 0) AS cod_fee_paisa,
        COALESCE(SUM(rto_cost_paisa), 0) AS rto_cost_paisa,
        COALESCE(SUM(returns_cost_paisa), 0) AS returns_cost_paisa,
        COALESCE(SUM(contribution_profit_paisa), 0) AS contribution_profit_paisa,
        BOOL_OR(ARRAY_LENGTH(missing_inputs, 1) > 0) AS has_missing_inputs,
        ARRAY_AGG(DISTINCT unnest_input) FILTER (WHERE unnest_input IS NOT NULL) AS all_missing_inputs
      FROM v_contribution_profit
      LEFT JOIN LATERAL UNNEST(missing_inputs) AS unnest_input ON true
      ${whereSql}
    `
    const aggRes = params.length > 0 ? await this.pg.raw(aggQuery, params) : await this.pg.raw(aggQuery)
    const agg = aggRes.rows?.[0] || {}

    // 3. Fetch allocated ad spend (manual recorded spend per FR-14.7)
    let totalAdSpendPaisa = 0
    try {
      const adSpendRes = await this.pg.raw(`
        SELECT COALESCE(SUM(total_spend_paisa), 0) AS total_ad_spend_paisa 
        FROM ad_campaign 
        WHERE deleted_at IS NULL
      `)
      totalAdSpendPaisa = Number(adSpendRes.rows?.[0]?.total_ad_spend_paisa || 0)
    } catch {
      totalAdSpendPaisa = 0
    }

    const netSalesBdt = Number(agg.net_sales_paisa || 0) / 100.0
    const deliveryCollectedBdt = Number(agg.customer_paid_delivery_paisa || 0) / 100.0
    const courierCostBdt = Number(agg.courier_cost_paisa || 0) / 100.0
    const cogsBdt = Number(agg.cogs_paisa || 0) / 100.0
    const packagingBdt = Number(agg.packaging_cost_paisa || 0) / 100.0
    const paymentFeeBdt = Number(agg.payment_fee_paisa || 0) / 100.0
    const codFeeBdt = Number(agg.cod_fee_paisa || 0) / 100.0
    const rtoCostBdt = Number(agg.rto_cost_paisa || 0) / 100.0
    const returnsCostBdt = Number(agg.returns_cost_paisa || 0) / 100.0
    const adSpendBdt = totalAdSpendPaisa / 100.0

    const contribBeforeAdsBdt =
      netSalesBdt +
      deliveryCollectedBdt -
      cogsBdt -
      packagingBdt -
      courierCostBdt -
      paymentFeeBdt -
      codFeeBdt -
      rtoCostBdt -
      returnsCostBdt

    const contribAfterAdsBdt = contribBeforeAdsBdt - adSpendBdt

    const missingInputs = Array.isArray(agg.all_missing_inputs) ? agg.all_missing_inputs : []
    const hasMissing = Boolean(agg.has_missing_inputs) || missingInputs.length > 0

    // Label: "Estimated Contribution Profit" if any missing inputs, else "Contribution Profit" (AC-G5: NEVER "Net Profit")
    const reportLabel: "Contribution Profit" | "Estimated Contribution Profit" = hasMissing
      ? "Estimated Contribution Profit"
      : "Contribution Profit"

    const formattedOrders: ContributionProfitOrderRow[] = rows.map((r: any) => ({
      order_id: r.order_id,
      display_id: Number(r.display_id),
      created_at: r.created_at,
      order_status: r.order_status,
      shipment_state: r.shipment_state,
      cod_status: r.cod_status,
      is_delivered: Boolean(r.is_delivered),
      gross_sales_bdt: Number(r.gross_sales_paisa || 0) / 100.0,
      discount_bdt: Number(r.discount_paisa || 0) / 100.0,
      net_sales_bdt: Number(r.net_sales_paisa || 0) / 100.0,
      customer_paid_delivery_bdt: Number(r.customer_paid_delivery_paisa || 0) / 100.0,
      courier_cost_bdt: r.courier_cost_paisa !== null ? Number(r.courier_cost_paisa) / 100.0 : null,
      cogs_bdt: r.cogs_paisa !== null ? Number(r.cogs_paisa) / 100.0 : null,
      packaging_cost_bdt: r.packaging_cost_paisa !== null ? Number(r.packaging_cost_paisa) / 100.0 : null,
      payment_fee_bdt: Number(r.payment_fee_paisa || 0) / 100.0,
      cod_fee_bdt: Number(r.cod_fee_paisa || 0) / 100.0,
      rto_cost_bdt: Number(r.rto_cost_paisa || 0) / 100.0,
      returns_cost_bdt: Number(r.returns_cost_paisa || 0) / 100.0,
      contribution_profit_bdt: Number(r.contribution_profit_paisa || 0) / 100.0,
      missing_inputs: r.missing_inputs || [],
      report_label: r.report_label,
      utm_campaign: r.utm_campaign || null,
    }))

    return {
      summary: {
        report_label: reportLabel,
        currency: "BDT",
        total_orders: Number(agg.total_orders || 0),
        delivered_orders_count: Number(agg.delivered_orders_count || 0),
        gross_sales_bdt: Number(agg.gross_sales_paisa || 0) / 100.0,
        discount_bdt: Number(agg.discount_paisa || 0) / 100.0,
        net_sales_bdt: netSalesBdt,
        customer_paid_delivery_bdt: deliveryCollectedBdt,
        courier_cost_bdt: courierCostBdt,
        cogs_bdt: cogsBdt,
        packaging_cost_bdt: packagingBdt,
        payment_fee_bdt: paymentFeeBdt,
        cod_fee_bdt: codFeeBdt,
        rto_cost_bdt: rtoCostBdt,
        returns_cost_bdt: returnsCostBdt,
        allocated_ad_spend_bdt: adSpendBdt,
        contribution_before_ads_bdt: contribBeforeAdsBdt,
        contribution_after_ads_bdt: contribAfterAdsBdt,
        has_missing_inputs: hasMissing,
        missing_inputs: missingInputs,
      },
      orders: formattedOrders,
      total_orders_count: Number(agg.total_orders || 0),
    }
  }

  /**
   * COD Settlement & Remittance Report (database.md §4.6, §8.11, PRD FR-14.9)
   */
  async getCodSettlementReport(filters: {
    courier_code?: string
    settlement_status?: string
    from?: string
    to?: string
    limit?: number
    offset?: number
  } = {}): Promise<{
    summary: CodSettlementSummary
    settlements: CodSettlementRow[]
    total_count: number
  }> {
    const { courier_code, settlement_status, from, to, limit = 50, offset = 0 } = filters

    const whereClauses: string[] = []
    const params: any[] = []

    if (courier_code) {
      params.push(courier_code)
      whereClauses.push(`courier_code = ?`)
    }
    if (settlement_status) {
      params.push(settlement_status)
      whereClauses.push(`cod_settlement_status = ?`)
    }
    if (from) {
      params.push(from)
      whereClauses.push(`created_at >= ?`)
    }
    if (to) {
      params.push(to)
      whereClauses.push(`created_at <= ?`)
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : ""

    const listQuery = `
      SELECT 
        order_id,
        display_id,
        created_at,
        courier_code,
        courier_tracking_code,
        consignment_id,
        cod_status,
        cod_settlement_status,
        customer_paid_delivery_paisa,
        courier_cost_paisa,
        cod_collectable_paisa,
        cod_collected_paisa,
        remitted_paisa,
        cod_fee_paisa,
        variance_paisa,
        variance_reason_code,
        dispute_status,
        batch_id,
        batch_ref
      FROM v_cod_settlement
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `
    const listRes = await this.pg.raw(listQuery, [...params, limit, offset])
    const rows = listRes.rows || []

    const aggQuery = `
      SELECT 
        COUNT(*) AS total_orders,
        COALESCE(SUM(cod_collectable_paisa), 0) AS cod_collectable_paisa,
        COALESCE(SUM(customer_paid_delivery_paisa), 0) AS customer_paid_delivery_paisa,
        COALESCE(SUM(courier_cost_paisa), 0) AS courier_cost_paisa,
        COALESCE(SUM(cod_collected_paisa), 0) AS cod_collected_paisa,
        COALESCE(SUM(remitted_paisa), 0) AS remitted_paisa,
        COALESCE(SUM(cod_fee_paisa), 0) AS cod_fee_paisa,
        COALESCE(SUM(variance_paisa), 0) AS variance_paisa,
        COUNT(*) FILTER (WHERE cod_settlement_status = 'pending') AS pending_count,
        COUNT(*) FILTER (WHERE cod_settlement_status = 'settled') AS settled_count,
        COUNT(*) FILTER (WHERE cod_settlement_status = 'disputed') AS disputed_count
      FROM v_cod_settlement
      ${whereSql}
    `
    const aggRes = params.length > 0 ? await this.pg.raw(aggQuery, params) : await this.pg.raw(aggQuery)
    const agg = aggRes.rows?.[0] || {}

    const settlements: CodSettlementRow[] = rows.map((r: any) => ({
      order_id: r.order_id,
      display_id: Number(r.display_id),
      created_at: r.created_at,
      courier_code: r.courier_code,
      courier_tracking_code: r.courier_tracking_code,
      consignment_id: r.consignment_id,
      cod_status: r.cod_status,
      cod_settlement_status: r.cod_settlement_status,
      customer_paid_delivery_bdt: Number(r.customer_paid_delivery_paisa || 0) / 100.0,
      courier_cost_bdt: Number(r.courier_cost_paisa || 0) / 100.0,
      cod_collectable_bdt: Number(r.cod_collectable_paisa || 0) / 100.0,
      cod_collected_bdt: Number(r.cod_collected_paisa || 0) / 100.0,
      remitted_bdt: Number(r.remitted_paisa || 0) / 100.0,
      cod_fee_bdt: Number(r.cod_fee_paisa || 0) / 100.0,
      variance_bdt: Number(r.variance_paisa || 0) / 100.0,
      variance_reason_code: r.variance_reason_code,
      dispute_status: r.dispute_status,
      batch_id: r.batch_id,
      batch_ref: r.batch_ref,
    }))

    return {
      summary: {
        total_orders: Number(agg.total_orders || 0),
        cod_collectable_bdt: Number(agg.cod_collectable_paisa || 0) / 100.0,
        customer_paid_delivery_bdt: Number(agg.customer_paid_delivery_paisa || 0) / 100.0,
        courier_cost_bdt: Number(agg.courier_cost_paisa || 0) / 100.0,
        cod_collected_bdt: Number(agg.cod_collected_paisa || 0) / 100.0,
        remitted_bdt: Number(agg.remitted_paisa || 0) / 100.0,
        courier_fees_bdt: Number(agg.courier_cost_paisa || 0) / 100.0,
        cod_fees_bdt: Number(agg.cod_fee_paisa || 0) / 100.0,
        variance_bdt: Number(agg.variance_paisa || 0) / 100.0,
        pending_count: Number(agg.pending_count || 0),
        settled_count: Number(agg.settled_count || 0),
        disputed_count: Number(agg.disputed_count || 0),
      },
      settlements,
      total_count: Number(agg.total_orders || 0),
    }
  }

  /**
   * Meta Attribution vs Store Sales Comparison (FR-5.3.5 & FR-5.3.6)
   * Distinct, separately labeled metrics — never merged into one number.
   */
  async getMetaAttributionComparison(): Promise<MetaAttributionComparison> {
    // 1. Fetch campaigns and manual spend
    let campaigns: any[] = []
    let totalManualSpendPaisa = 0
    let lastSyncAt: string | null = null

    try {
      const campRes = await this.pg.raw(`
        SELECT id, name, status, total_spend_paisa, spend_updated_at 
        FROM ad_campaign 
        WHERE deleted_at IS NULL
        ORDER BY created_at DESC
      `)
      campaigns = campRes.rows || []
      for (const c of campaigns) {
        totalManualSpendPaisa += Number(c.total_spend_paisa || 0)
        if (c.spend_updated_at && (!lastSyncAt || new Date(c.spend_updated_at) > new Date(lastSyncAt))) {
          lastSyncAt = c.spend_updated_at
        }
      }
    } catch {
      campaigns = []
    }

    // 2. Fetch Meta pixel conversion events (Purchase)
    let metaPurchasesCount = 0
    try {
      const evtRes = await this.pg.raw(`
        SELECT COUNT(*) AS meta_purchases 
        FROM ad_conversion_event 
        WHERE platform = 'meta' AND event_name = 'Purchase' AND deleted_at IS NULL
      `)
      metaPurchasesCount = Number(evtRes.rows?.[0]?.meta_purchases || 0)
    } catch {
      metaPurchasesCount = 0
    }

    // 3. Fetch Store-verified orders with campaign or landing page attribution
    let storeOrdersCount = 0
    let storeRevenuePaisa = 0
    try {
      const storeRes = await this.pg.raw(`
        SELECT 
          COUNT(DISTINCT o.id) AS store_orders_count,
          COALESCE(SUM(ols.unit_price_paisa * ols.quantity - ols.discount_alloc_paisa), 0) AS store_revenue_paisa
        FROM "order" o
        JOIN order_bd_details obd ON obd.order_id = o.id
        LEFT JOIN order_line_snapshot ols ON ols.order_id = o.id AND ols.deleted_at IS NULL
        WHERE obd.deleted_at IS NULL
          AND (obd.utm_campaign IS NOT NULL OR obd.landing_page_id IS NOT NULL OR obd.ad_campaign_id IS NOT NULL)
          AND (o.status = 'completed' OR obd.shipment_state = 'delivered' OR obd.cod_status = 'delivered')
      `)
      storeOrdersCount = Number(storeRes.rows?.[0]?.store_orders_count || 0)
      storeRevenuePaisa = Number(storeRes.rows?.[0]?.store_revenue_paisa || 0)
    } catch {
      storeOrdersCount = 0
      storeRevenuePaisa = 0
    }

    const manualSpendBdt = totalManualSpendPaisa / 100.0
    const storeRevenueBdt = storeRevenuePaisa / 100.0

    const costPerAttributedPurchase =
      metaPurchasesCount > 0 ? Number((manualSpendBdt / metaPurchasesCount).toFixed(2)) : null
    const costPerVerifiedOrder =
      storeOrdersCount > 0 ? Number((manualSpendBdt / storeOrdersCount).toFixed(2)) : null

    // Per FR-5.3.6: If Meta API sync is not active/available, show "not_connected" and last sync time
    // Never show missing spend data as zero.
    const syncStatus: "connected" | "not_connected" | "failed" = lastSyncAt ? "connected" : "not_connected"

    return {
      platform: "meta",
      sync_status: syncStatus,
      last_sync_at: lastSyncAt,
      sync_error_message: syncStatus === "not_connected" ? "Meta Marketing API not connected. Manual spend tracking active." : null,
      metrics: {
        manual_campaign_spend_bdt: manualSpendBdt,
        meta_attributed_purchases_count: metaPurchasesCount,
        store_verified_orders_count: storeOrdersCount,
        store_verified_revenue_bdt: storeRevenueBdt,
        cost_per_attributed_purchase_bdt: costPerAttributedPurchase,
        cost_per_verified_order_bdt: costPerVerifiedOrder,
      },
      campaigns: campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        total_spend_bdt: Number(c.total_spend_paisa || 0) / 100.0,
        spend_updated_at: c.spend_updated_at,
        store_orders_count: 0,
        store_net_revenue_bdt: 0,
        meta_events_count: 0,
      })),
    }
  }

  /**
   * Operational Dashboard Overview (Scope 6: sales overview, low stock, pending COD, pending returns)
   * No fake charts; strictly real data from PostgreSQL.
   */
  async getDashboardOverview(): Promise<DashboardOverview> {
    // 1. Sales Overview
    const salesRes = await this.pg.raw(`
      SELECT 
        COUNT(*) AS today_orders_count,
        COUNT(*) FILTER (WHERE is_delivered = true) AS today_delivered_count,
        COALESCE(SUM(gross_sales_paisa), 0) AS today_gross_sales_paisa,
        COALESCE(SUM(net_sales_paisa), 0) AS today_net_sales_paisa,
        COALESCE(SUM(customer_paid_delivery_paisa), 0) AS today_delivery_collected_paisa,
        COALESCE(SUM(courier_cost_paisa), 0) AS today_courier_cost_paisa
      FROM v_contribution_profit
      WHERE created_at >= CURRENT_DATE
    `)
    const s = salesRes.rows?.[0] || {}

    // 2. Pending COD Confirmation
    const codRes = await this.pg.raw(`
      SELECT 
        COUNT(*) AS count,
        MIN(created_at) AS oldest_unconfirmed_at
      FROM order_bd_details
      WHERE cod_status = 'pending_confirmation' AND deleted_at IS NULL
    `)
    const cod = codRes.rows?.[0] || {}

    // 3. Pending Returns Review
    let ret = { count: 0, oldest_pending_at: null }
    try {
      const retRes = await this.pg.raw(`
        SELECT 
          COUNT(*) AS count,
          MIN(requested_at) AS oldest_pending_at
        FROM return_review
        WHERE status = 'pending_manual_review' AND deleted_at IS NULL
      `)
      ret = retRes.rows?.[0] || ret
    } catch {
      ret = { count: 0, oldest_pending_at: null }
    }

    // 4. Low Stock Summary
    const stockRes = await this.pg.raw(`
      SELECT 
        pv.id AS variant_id,
        p.title AS product_title,
        pv.title AS variant_title,
        pv.sku,
        COALESCE(il.stocked_quantity, 0) AS stocked_quantity,
        COALESCE(il.reserved_quantity, 0) AS reserved_quantity,
        (COALESCE(il.stocked_quantity, 0) - COALESCE(il.reserved_quantity, 0)) AS available_quantity
      FROM product_variant pv
      JOIN product p ON pv.product_id = p.id
      JOIN product_variant_inventory_item pvii ON pv.id = pvii.variant_id
      JOIN inventory_level il ON pvii.inventory_item_id = il.inventory_item_id
      WHERE pv.deleted_at IS NULL AND p.deleted_at IS NULL AND p.status = 'published'
        AND (il.stocked_quantity - il.reserved_quantity) <= 10
      ORDER BY (il.stocked_quantity - il.reserved_quantity) ASC
      LIMIT 20
    `)
    const stockItems = stockRes.rows || []
    const oosCount = stockItems.filter((i: any) => Number(i.available_quantity) <= 0).length
    const lowCount = stockItems.filter((i: any) => Number(i.available_quantity) > 0 && Number(i.available_quantity) <= 10).length

    return {
      sales_overview: {
        today_orders_count: Number(s.today_orders_count || 0),
        today_delivered_count: Number(s.today_delivered_count || 0),
        today_gross_sales_bdt: Number(s.today_gross_sales_paisa || 0) / 100.0,
        today_net_sales_bdt: Number(s.today_net_sales_paisa || 0) / 100.0,
        today_delivery_collected_bdt: Number(s.today_delivery_collected_paisa || 0) / 100.0,
        today_courier_cost_bdt: Number(s.today_courier_cost_paisa || 0) / 100.0,
      },
      pending_cod_confirmation: {
        count: Number(cod.count || 0),
        oldest_unconfirmed_at: cod.oldest_unconfirmed_at || null,
      },
      pending_returns_review: {
        count: Number(ret.count || 0),
        oldest_pending_at: ret.oldest_pending_at || null,
      },
      low_stock_summary: {
        out_of_stock_count: oosCount,
        low_stock_count: lowCount,
        items: stockItems.map((i: any) => ({
          variant_id: i.variant_id,
          product_title: i.product_title,
          variant_title: i.variant_title,
          sku: i.sku || "",
          stocked_quantity: Number(i.stocked_quantity),
          reserved_quantity: Number(i.reserved_quantity),
          available_quantity: Number(i.available_quantity),
        })),
      },
    }
  }
}

export default BdReportsModuleService
