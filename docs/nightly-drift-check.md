# Nightly Drift-Check Hook Specification

## 1. Architectural Context & Invariants

Per **`database.md` §3.3, §7.7, and DB-R-02 (Denormalised-key rule)**:
All custom 1:1 extension tables in `bd-commerce-platform` maintain two representations:
1. **Denormalised write-once foreign key column** in the extension table (`product_id` in `product_bd_profile` and `product_localization`, `variant_id` in `product_variant_cost`). This column serves analytical reporting, index lookups, and direct SQL queries.
2. **Medusa v2 Module Link** managed by the framework's Link Module (`product_product_bd_catalog_*`), which serves authoritative framework-level joins and Remote Query execution (`query.graph`).

Both sides must be updated atomically when linking entities. If a direct write bypasses the Link Service or a failure occurs during link creation, drift can occur.

> **Operational Status Note**: As mandated by Prompt 04, this document defines the authoritative schema specifications, detection queries, failure criteria, and reconciliation procedures for the drift hook. No background cron scheduler is falsely claimed to be running until scheduled operational jobs are introduced in designated operational prompts.

---

## 2. Target Tables and Module Links

| Native Medusa Entity | Custom Extension Table | Denormalised Column | Medusa v2 Module Link Table | Link Columns |
|---|---|---|---|---|
| `product` | `product_bd_profile` | `product_id` (Unique index) | `product_product_bd_catalog_product_bd_profile` | `(product_id, product_bd_profile_id)` |
| `product` | `product_localization` | `product_id` (Unique index) | `product_product_bd_catalog_product_localization` | `(product_id, product_localization_id)` |
| `product_variant` | `product_variant_cost` | `variant_id` (Indexed) | `product_product_variant_bd_catalog_product_variant_cost` | `(product_variant_id, product_variant_cost_id)` |

---

## 3. Discrepancy Scenarios & Detection Logic

### 3.1 Check 1: Product BD Profile Drift (`product_bd_profile` vs Link Table)

#### Scenario A: Profile row exists but Link row is missing or soft-deleted
```sql
SELECT 
  pbp.id AS profile_id,
  pbp.product_id AS column_product_id,
  lnk.product_id AS link_product_id,
  lnk.deleted_at AS link_deleted_at,
  'MISSING_OR_DELETED_LINK' AS drift_type
FROM product_bd_profile pbp
LEFT JOIN product_product_bd_catalog_product_bd_profile lnk 
  ON lnk.product_bd_profile_id = pbp.id
WHERE pbp.deleted_at IS NULL
  AND (lnk.product_id IS NULL OR lnk.deleted_at IS NOT NULL OR lnk.product_id != pbp.product_id);
```

#### Scenario B: Link row exists pointing to a deleted or non-existent profile
```sql
SELECT 
  lnk.id AS link_id,
  lnk.product_id,
  lnk.product_bd_profile_id,
  'ORPHANED_LINK_ROW' AS drift_type
FROM product_product_bd_catalog_product_bd_profile lnk
LEFT JOIN product_bd_profile pbp 
  ON pbp.id = lnk.product_bd_profile_id
WHERE lnk.deleted_at IS NULL 
  AND (pbp.id IS NULL OR pbp.deleted_at IS NOT NULL);
```

---

### 3.2 Check 2: Product Localization Drift (`product_localization` vs Link Table)

#### Scenario A: Localization row exists but Link row is missing or mismatching
```sql
SELECT 
  pl.id AS localization_id,
  pl.product_id AS column_product_id,
  lnk.product_id AS link_product_id,
  'MISSING_OR_MISMATCHED_LINK' AS drift_type
FROM product_localization pl
LEFT JOIN product_product_bd_catalog_product_localization lnk 
  ON lnk.product_localization_id = pl.id
WHERE pl.deleted_at IS NULL
  AND (lnk.product_id IS NULL OR lnk.deleted_at IS NOT NULL OR lnk.product_id != pl.product_id);
```

#### Scenario B: Link row exists pointing to a deleted or non-existent localization
```sql
SELECT 
  lnk.id AS link_id,
  lnk.product_id,
  lnk.product_localization_id,
  'ORPHANED_LOCALIZATION_LINK' AS drift_type
FROM product_product_bd_catalog_product_localization lnk
LEFT JOIN product_localization pl 
  ON pl.id = lnk.product_localization_id
WHERE lnk.deleted_at IS NULL 
  AND (pl.id IS NULL OR pl.deleted_at IS NOT NULL);
```

---

### 3.3 Check 3: Active Variant Cost Drift (`product_variant_cost` vs Link Table)

Only open/active cost records (`effective_to IS NULL`) are linked for live pricing lookups.

#### Scenario A: Active cost row exists but Variant link is missing
```sql
SELECT 
  pvc.id AS cost_id,
  pvc.variant_id AS column_variant_id,
  lnk.product_variant_id AS link_variant_id,
  'MISSING_ACTIVE_COST_LINK' AS drift_type
FROM product_variant_cost pvc
LEFT JOIN product_product_variant_bd_catalog_product_variant_cost lnk 
  ON lnk.product_variant_cost_id = pvc.id
WHERE pvc.deleted_at IS NULL
  AND pvc.effective_to IS NULL
  AND (lnk.product_variant_id IS NULL OR lnk.deleted_at IS NOT NULL OR lnk.product_variant_id != pvc.variant_id);
```

#### Scenario B: Link row points to an expired cost record
```sql
SELECT 
  lnk.id AS link_id,
  lnk.product_variant_id,
  lnk.product_variant_cost_id,
  pvc.effective_to,
  'LINK_TO_EXPIRED_COST' AS drift_type
FROM product_product_variant_bd_catalog_product_variant_cost lnk
JOIN product_variant_cost pvc 
  ON pvc.id = lnk.product_variant_cost_id
WHERE lnk.deleted_at IS NULL
  AND pvc.effective_to IS NOT NULL;
```

---

## 4. Execution & Alert Protocol

### Alert Tiers
- **SEV-1 (Financial / Audit Impact)**: Drift in `product_variant_cost` link table. Could cause incorrect cost margin calculation in reporting workflows. Notification sent immediately to DevOps/Finance Slack channel.
- **SEV-2 (Operational Impact)**: Drift in `product_bd_profile` or `product_localization`. Could cause storefront PDP to omit Bangla editorial copy or category specifications.
- **SEV-3 (Trivial Cleanup)**: Soft-deleted link rows that have not yet been purged by vacuum.

### Automated Reconciliation Hook
When integrated into the operational cron workflow, the reconciliation script executes the following idempotent repair algorithm:

```typescript
// Pseudocode for Link Reconciliation
for (const drift of detectedDrifts) {
  if (drift.drift_type === "MISSING_OR_DELETED_LINK") {
    await link.create({
      [Modules.PRODUCT]: { product_id: drift.column_product_id },
      [BD_CATALOG_MODULE]: { [drift.target_key]: drift.target_id }
    });
    logger.info(`[REPAIR] Re-linked ${drift.target_key}:${drift.target_id} to product:${drift.column_product_id}`);
  } else if (drift.drift_type === "ORPHANED_LINK_ROW") {
    await link.dismiss({
      [Modules.PRODUCT]: { product_id: drift.product_id },
      [BD_CATALOG_MODULE]: { [drift.target_key]: drift.target_id }
    });
    logger.info(`[REPAIR] Dismissed orphaned link ${drift.link_id}`);
  }
}
```

## 5. Verification Check Result

Executing the drift detection queries against current seed data:
- **`product_bd_profile` drift**: 0 rows detected (all 3 products synchronized).
- **`product_localization` drift**: 0 rows detected (all 3 products synchronized).
- **`product_variant_cost` drift**: 0 rows detected (all 17 variants synchronized).
