-- ============================================================================
-- bd-reports: Reporting Views Migration
-- Prompt 16 — Analytics (PRD §14, AC-14.1, AC-14.2, AC-G5, FR-14.9, database.md §8.14)
-- ============================================================================

-- View 1: v_contribution_profit
DROP VIEW IF EXISTS v_contribution_profit CASCADE;
CREATE VIEW v_contribution_profit AS
WITH order_aggregates AS (
  SELECT 
    ols.order_id,
    COALESCE(SUM(ols.unit_price_paisa * ols.quantity), 0) AS gross_sales_paisa,
    COALESCE(SUM(ols.discount_alloc_paisa), 0) AS discount_paisa,
    COALESCE(SUM(ols.unit_price_paisa * ols.quantity - ols.discount_alloc_paisa), 0) AS merchandise_net_sales_paisa,
    SUM(ols.cogs_total_paisa) AS cogs_total_paisa,
    BOOL_OR(ols.cogs_unit_paisa IS NULL) AS has_null_cogs,
    COALESCE(SUM(ols.packaging_alloc_paisa), 0) AS packaging_lines_paisa
  FROM order_line_snapshot ols
  WHERE ols.deleted_at IS NULL
  GROUP BY ols.order_id
),
returns_aggregates AS (
  SELECT 
    rr.order_id,
    COALESCE(SUM(rr.refund_amount_paisa), 0) AS total_refunds_paisa,
    COALESCE(SUM(CASE WHEN rr.return_shipping_paid_by = 'merchant' THEN COALESCE(rr.return_shipping_cost_paisa, 0) ELSE 0 END), 0) AS merchant_return_shipping_paisa
  FROM return_review rr
  WHERE rr.deleted_at IS NULL AND rr.refund_status IN ('approved', 'paid')
  GROUP BY rr.order_id
)
SELECT 
  o.id AS order_id,
  o.display_id,
  o.created_at,
  o.status AS order_status,
  obd.shipment_state,
  obd.cod_status,
  obd.utm_source,
  obd.utm_campaign,
  obd.landing_page_id,
  obd.ad_campaign_id,
  
  -- Delivery status rule (AC-14.2)
  CASE 
    WHEN o.status = 'completed' OR obd.shipment_state = 'delivered' OR obd.cod_status = 'delivered' THEN true
    ELSE false
  END AS is_delivered,

  -- Revenue numbers
  COALESCE(oa.gross_sales_paisa, 0) AS gross_sales_paisa,
  COALESCE(oa.discount_paisa, 0) AS discount_paisa,
  
  -- Net sales (AC-14.2): Cancelled/undelivered orders contribute 0 net sales
  CASE 
    WHEN o.status = 'canceled' OR obd.shipment_state IN ('cancelled', 'rto', 'lost') OR obd.cod_status = 'canceled' THEN 0
    WHEN o.status = 'completed' OR obd.shipment_state = 'delivered' OR obd.cod_status = 'delivered' THEN COALESCE(oa.merchandise_net_sales_paisa, 0)
    ELSE 0
  END AS net_sales_paisa,

  -- Delivery collected vs Courier cost (FR-14.9 - strictly distinct)
  COALESCE(obd.customer_paid_delivery_paisa, 0) AS customer_paid_delivery_paisa,
  obd.courier_cost_paisa,

  -- Cost breakdown
  oa.cogs_total_paisa AS cogs_paisa,
  COALESCE(obd.packaging_cost_paisa, oa.packaging_lines_paisa, 0) AS packaging_cost_paisa,
  COALESCE(obd.payment_fee_paisa, 0) AS payment_fee_paisa,
  COALESCE(obd.cod_handling_fee_paisa, 0) AS cod_fee_paisa,
  COALESCE(obd.rto_shipping_cost_paisa, 0) AS rto_cost_paisa,
  (COALESCE(ra.total_refunds_paisa, 0) + COALESCE(ra.merchant_return_shipping_paisa, 0)) AS returns_cost_paisa,

  -- Missing inputs tracking (AC-14.1, database.md §8.14)
  ARRAY_REMOVE(ARRAY[
    CASE WHEN oa.has_null_cogs OR oa.cogs_total_paisa IS NULL THEN 'cogs' ELSE NULL END,
    CASE WHEN obd.courier_cost_paisa IS NULL THEN 'courier_cost' ELSE NULL END,
    CASE WHEN obd.packaging_cost_paisa IS NULL AND oa.packaging_lines_paisa IS NULL THEN 'packaging_cost' ELSE NULL END
  ], NULL) AS missing_inputs,

  -- Contribution profit calculation
  (
    (CASE 
      WHEN o.status = 'canceled' OR obd.shipment_state IN ('cancelled', 'rto', 'lost') OR obd.cod_status = 'canceled' THEN 0
      WHEN o.status = 'completed' OR obd.shipment_state = 'delivered' OR obd.cod_status = 'delivered' THEN COALESCE(oa.merchandise_net_sales_paisa, 0)
      ELSE 0
    END)
    + COALESCE(obd.customer_paid_delivery_paisa, 0)
    - COALESCE(oa.cogs_total_paisa, 0)
    - COALESCE(obd.packaging_cost_paisa, oa.packaging_lines_paisa, 0)
    - COALESCE(obd.courier_cost_paisa, 0)
    - COALESCE(obd.payment_fee_paisa, 0)
    - COALESCE(obd.cod_handling_fee_paisa, 0)
    - COALESCE(obd.rto_shipping_cost_paisa, 0)
    - (COALESCE(ra.total_refunds_paisa, 0) + COALESCE(ra.merchant_return_shipping_paisa, 0))
  ) AS contribution_profit_paisa,

  -- UI Report Label rule (AC-14.1, AC-G5: NEVER 'Net Profit')
  CASE 
    WHEN (oa.has_null_cogs OR oa.cogs_total_paisa IS NULL OR obd.courier_cost_paisa IS NULL)
      THEN 'Estimated Contribution Profit'
    ELSE 'Contribution Profit'
  END AS report_label

FROM "order" o
JOIN order_bd_details obd ON obd.order_id = o.id AND obd.deleted_at IS NULL
LEFT JOIN order_aggregates oa ON oa.order_id = o.id
LEFT JOIN returns_aggregates ra ON ra.order_id = o.id
WHERE o.deleted_at IS NULL;


-- View 2: v_cod_settlement
DROP VIEW IF EXISTS v_cod_settlement CASCADE;
CREATE VIEW v_cod_settlement AS
SELECT 
  o.id AS order_id,
  o.display_id,
  o.created_at,
  obd.courier_code,
  obd.courier_tracking_code,
  obd.consignment_id,
  obd.cod_status,
  
  -- Distinct delivery collected vs courier fee charged (FR-14.9)
  COALESCE(obd.customer_paid_delivery_paisa, 0) AS customer_paid_delivery_paisa,
  COALESCE(obd.courier_cost_paisa, 0) AS courier_cost_paisa,
  
  -- COD figures
  COALESCE(obd.cod_collectable_paisa, 0) AS cod_collectable_paisa,
  COALESCE(obd.cod_collected_paisa, 0) AS cod_collected_paisa,
  COALESCE(crl.remitted_paisa, 0) AS remitted_paisa,
  COALESCE(obd.cod_handling_fee_paisa, 0) AS cod_fee_paisa,
  
  -- Variance and settlement
  COALESCE(crl.variance_paisa, (COALESCE(obd.cod_collectable_paisa, 0) - COALESCE(crl.remitted_paisa, 0))) AS variance_paisa,
  crl.variance_reason_code,
  crl.dispute_status,
  crb.id AS batch_id,
  crb.batch_ref,
  
  CASE 
    WHEN crl.dispute_status = 'disputed' THEN 'disputed'
    WHEN crl.id IS NOT NULL AND (crl.remitted_paisa IS NOT NULL AND crl.remitted_paisa > 0) THEN 'settled'
    ELSE 'pending'
  END AS cod_settlement_status

FROM "order" o
JOIN order_bd_details obd ON obd.order_id = o.id AND obd.deleted_at IS NULL
LEFT JOIN courier_remittance_line crl ON crl.order_id = o.id AND crl.deleted_at IS NULL
LEFT JOIN courier_remittance_batch crb ON crb.id = crl.batch_id AND crb.deleted_at IS NULL
WHERE o.deleted_at IS NULL;
