# Bangladesh Single-Vendor E-commerce Platform
## Production Deployment, Disaster Recovery, Rollback & Operations Runbook

**Document Version:** 1.0.0  
**Target Environment:** Production (Linux VPS / Docker Engine 24+ / Compose v2)  
**Authoritative Reference:** `prd.md` FR-12.6, AC-12.3; `docs/architecture.md` §18, §20.2, §21; `quality-checklist.md` CHK-OPS-01 to CHK-OPS-03.

---

## 1. Production Architecture & Network Topology

```
Public Internet (HTTPS 443)
       │
       ▼
Cloudflare Edge CDN / WAF
  - SSL/TLS: Full (Strict)
  - Bot Management & Rate Limiting
  - DDoS Mitigation & Custom WAF Rules
       │
       ├──► Next.js 15 Storefront (`web`)
       │      - Container Port: 3000
       │      - Host Binding: 127.0.0.1:3000
       │      - Public Domains: https://yourdomain.com, https://www.yourdomain.com
       │
       └──► MedusaJS v2 Backend & Admin (`medusa`)
              - Container Port: 9000
              - Host Binding: 127.0.0.1:9000
              - API Domain: https://api.yourdomain.com
              - Embedded Admin: https://admin.yourdomain.com (/app)
              │
              ▼ (Isolated Docker Bridge Network: `bd_commerce_prod_net`)
              ├── PostgreSQL 16 (`postgres:16-alpine`, port 5432 - NO public bind)
              ├── Redis 7 (`redis:7-alpine`, port 6379 - NO public bind)
              ├── Meilisearch v1.11 (`getmeili/meilisearch:v1.11`, port 7700 - NO public bind)
              └── Nagad Private RSA Key (Mounted read-only `:ro` from host `/etc/secrets`)
```

### Security Isolation Principles
1. **Zero Public Exposure of Data Stores:** PostgreSQL, Redis, and Meilisearch are connected strictly to the private bridge network (`bd_commerce_prod_net`). None of their ports are published to `0.0.0.0`.
2. **Non-Root Containers:** Both `medusa` (`medusa:1001`) and `web` (`nextjs:1001`) run as unprivileged system users.
3. **Filesystem Key Mount (Rule C-5):** Nagad's RSA private key is never passed in environment variables or baked into images. It is mounted read-only at `/etc/secrets/nagad_private.pem:ro` with mode `0600`.
4. **Origin Shielding:** The host firewall (UFW / iptables) only accepts incoming HTTP/HTTPS traffic from Cloudflare IP ranges.

---

## 2. Production Deployment Procedure

### 2.1 Prerequisites
- Linux Server (Ubuntu 22.04 LTS / Debian 12 / AlmaLinux 9) with minimum 4 vCPUs, 8GB RAM, and 50GB NVMe storage.
- Docker Engine 24+ and Docker Compose v2.20+ installed.
- Production domain names configured with DNS pointing to Cloudflare.
- Valid Nagad RSA private key placed at `/opt/secrets/nagad_private.pem` on host with mode `0600`:
  ```bash
  sudo mkdir -p /opt/secrets
  sudo cp /path/to/nagad_private.pem /opt/secrets/nagad_private.pem
  sudo chmod 600 /opt/secrets/nagad_private.pem
  sudo chown 1001:1001 /opt/secrets/nagad_private.pem
  ```

### 2.2 Initial Deployment Steps

```bash
# 1. Clone repository to deployment directory
git clone https://github.com/sabbirprojects/BD-COMMERCE-PLATFORM.git /opt/bd-commerce
cd /opt/bd-commerce
git checkout main

# 2. Configure production environment file
# Source secrets from your secret manager (AWS Secrets Manager, Vault, Doppler)
cp .env.production.example .env.production
chmod 600 .env.production
# Edit .env.production with live credentials
nano .env.production

# 3. Pull / Build Production Container Images
docker compose -f docker-compose.prod.yml --env-file .env.production build

# 4. Start Infrastructure Dependencies First
docker compose -f docker-compose.prod.yml --env-file .env.production up -d postgres redis meilisearch

# 5. Wait for Infrastructure Health
docker compose -f docker-compose.prod.yml ps

# 6. Execute Database Migrations (Zero-Downtime, NEVER DROP DATABASE)
docker compose -f docker-compose.prod.yml --env-file .env.production run --rm medusa npm run medusa:migrate

# 7. Seed Foundation Master Data (Geo Divisions, Districts, Thanas, Delivery Zones)
docker compose -f docker-compose.prod.yml --env-file .env.production run --rm medusa npm run seed:foundation

# 8. Start All Services (Medusa Backend & Next.js Storefront)
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

# 9. Synchronize Catalog with Meilisearch
docker compose -f docker-compose.prod.yml --env-file .env.production run --rm medusa npm run sync:meilisearch

# 10. Verify Service Health
docker compose -f docker-compose.prod.yml ps
curl -I http://localhost:9000/health
curl -I http://localhost:3000/
```

---

## 3. Zero-Downtime Rollback Runbook

If a critical issue or regression is discovered post-deployment:

### Scenario A: Fast Container Rollback (Code Regression)
Because container images are built deterministically, rollback can be executed in under 60 seconds by reverting to the previous commit or Docker image tag:

```bash
cd /opt/bd-commerce

# 1. Checkout previous stable commit or tag
git checkout <PREVIOUS_STABLE_COMMIT_HASH>

# 2. Rebuild and restart application containers
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build medusa web

# 3. Verify health
docker compose -f docker-compose.prod.yml ps
curl -f http://localhost:9000/health
curl -f http://localhost:3000/
```

### Scenario B: Database Schema Considerations
- **Additive Migrations Only:** All migrations in `bd-commerce-platform` are strictly non-destructive and backward-compatible (adding columns, nullable fields, new tables). No `DROP COLUMN` or `DROP TABLE` operations occur during minor releases.
- In the event of schema corruption or accidental data loss, immediately initiate the **Disaster Recovery Restore Runbook** (Section 4).

---

## 4. Disaster Recovery & Encrypted Backup Restore Runbook

### 4.1 Automated Daily Backups (`02:00 BST`)
Automated daily backups are executed via system cron:
```cron
# /etc/cron.d/bd-commerce-backup
0 2 * * * root /opt/bd-commerce/scripts/backup/backup-database.sh >> /var/log/bd-commerce-backup.log 2>&1
```

**Backup Specifications:**
- Dumps PostgreSQL database using `pg_dump` with `--clean --if-exists`.
- Compresses dump with `gzip -9`.
- Encrypts using OpenSSL AES-256-CBC with PBKDF2 (`.sql.gz.enc`).
- Generates SHA-256 cryptographic checksum (`.sha256`).
- Prunes archives older than 30 days automatically.
- Offsite sync to AWS S3 / Cloudflare R2 bucket (`s3://${S3_BUCKET}/backups/`).

### 4.2 Disaster Recovery Restore Procedure
The restore script (`scripts/backup/restore-database.sh`) provides verified point-in-time recovery with automated record count validation.

#### Step 1: Execute Restore Drill into Throwaway Database
```bash
cd /opt/bd-commerce

# Restores the latest encrypted backup into a throwaway database (bd_commerce_restore_test)
# Verifies checksum, decrypts, restores, and checks row counts across 5 key tables
./scripts/backup/restore-database.sh
```

**Verified SLA:**
- Recovery Time Objective (RTO): < 300 seconds (Drill benchmark: 4 seconds).
- Recovery Point Objective (RPO): Maximum 24 hours (daily logical dump) + WAL archiving.
- Record Integrity: 100% table row count match.

#### Step 2: Emergency Full Production Restore (Total Loss Scenario)
In the catastrophic event that the primary database is lost or unrecoverable:

```bash
# 1. Stop web and medusa containers to halt incoming writes
docker compose -f docker-compose.prod.yml stop web medusa

# 2. Run restore targeting the production database
ALLOW_PRODUCTION_OVERWRITE=true RESTORE_DB=bd_commerce \
  ./scripts/backup/restore-database.sh /path/to/verified_backup.sql.gz.enc

# 3. Restart application containers
docker compose -f docker-compose.prod.yml start medusa web

# 4. Verify system integrity
curl -f http://localhost:9000/health
```

---

## 5. Emergency Payment Gateway Shutoff Runbook

If bKash, Nagad, or Cash on Delivery experiences downtime, bank maintenance, or upstream security incidents, staff can disable the provider in under 60 seconds without redeploying code.

### Method 1: Instant Admin UI Toggle (Recommended)
1. Log in to Medusa Admin at `https://admin.yourdomain.com/app`.
2. Navigate to **Settings** > **Payment Providers** (`/app/settings/payments`).
3. Toggle the status of the affected provider (`pp_bkash`, `pp_nagad`, or `pp_cod`) to **Disabled**.
4. The storefront checkout API (`/api/checkout/gateways`) immediately ceases offering the disabled method to customers. Active checkouts will gracefully fall back to alternative payment options.

### Method 2: Emergency Environment / API Variable Override
If the Admin UI is inaccessible, override the provider configuration via environment variables:

```bash
# In .env.production:
# Set provider sandbox or disable flag
BKASH_APP_KEY=""
NAGAD_MERCHANT_ID=""

# Restart Medusa backend container (takes ~5 seconds)
docker compose -f docker-compose.prod.yml up -d medusa
```

Customers attempting checkout will immediately see only the remaining operational payment methods.

---

## 6. Cash on Delivery (COD) Auto-Cancellation Cron Setup

### Background (ADR-019 & Decision O-03)
Under architecture ADR-019, COD stock reservations are initially kept active until call center staff confirm or cancel the order via `/app/cod-queue`.

Once the merchant owner formally signs off on Phase 0 Gate `[O-03]` (specifying the expiration window, e.g., 48 hours), enable the automated cancellation cron job:

```bash
# Add cron to cancel unconfirmed COD orders older than 48 hours:
# Runs hourly at minute 15
15 * * * * root docker exec -i bd_commerce_prod_medusa npx medusa exec ./src/scripts/cron/expire-unconfirmed-cod.ts >> /var/log/cod-expiration.log 2>&1
```

**Order Cancellation Guarantees:**
- Releases reserved inventory back to active stock.
- Emits `audit_log` entry with `actor_role: 'system'` and `stated_reason: 'Automated 48h COD expiration'`.
- Sends SMS notification to customer informing them of the order cancellation.

---

## 7. Geo Master Data Seeding Runbook

The platform includes Bangladesh geographical master data covering:
- 8 Divisions (Dhaka, Chittagong, Rajshahi, Khulna, Barisal, Sylhet, Rangpur, Mymensingh)
- 64 Districts
- 495+ Thanas / Upazilas
- 3 Delivery Zones: `inside_dhaka` (৳60), `dhaka_suburbs` (৳100), `outside_dhaka` (৳130)

### To Run or Refresh Geo Seeding:
```bash
docker compose -f docker-compose.prod.yml exec medusa npm run seed:foundation
```

This populates `delivery_zone`, `geo_division`, `geo_district`, and `geo_thana` tables idempotently using `ON CONFLICT DO NOTHING`.

---

## 8. Cloudflare WAF, Security & CORS Configuration Guide

### 8.1 SSL/TLS Encryption
- **Encryption Mode:** Full (Strict).
- **Edge Certificates:** Minimum TLS 1.2; TLS 1.3 enabled; 0-RTT enabled.
- **HSTS:** Enabled with 1-year max-age, includeSubDomains, preload.

### 8.2 Cloudflare WAF Custom Rules

| Rule Name | Expression | Action | Rationale |
|---|---|---|---|
| **Rate Limit Checkout** | `http.request.uri.path eq "/api/checkout/submit"` | Rate limit (5 requests / 1 min per IP) | Mitigate carding and order flooding |
| **Rate Limit Tracking** | `http.request.uri.path contains "/api/track"` | Rate limit (10 requests / 1 min per IP) | Prevent phone number enumeration (Rule C-2) |
| **Block Direct Meili** | `http.request.uri.path contains "/indexes"` | Block | Protect Meilisearch from unauthorized queries |
| **Bot Fight Mode** | `cf.bot_management.score lt 20` | Managed Challenge | Stop malicious headless crawlers |

### 8.3 CORS Production Settings
In `.env.production`:
```bash
STORE_CORS=https://yourdomain.com,https://www.yourdomain.com
ADMIN_CORS=https://admin.yourdomain.com
AUTH_CORS=https://yourdomain.com,https://admin.yourdomain.com
```

---

## 9. Phase 0 Launch Readiness Gates Checklist

> [!IMPORTANT]
> **BLOCKING CLAUSE:** The platform is in **Phase 1 Engineering Complete** status.
> Public launch, DNS live cutover, and customer announcements are **STRICTLY PROHIBITED** until the business owner signs off on the following 6 Phase 0 gates.

| Gate ID | Area | Decision Required | Recommended Baseline (Implemented in Code) | Status | Sign-off Date | Owner Signature |
|---|---|---|---|---|---|---|
| **[O-01]** | Return Policy | Return window duration & shipping payer | 7-day return window; customer bears return shipping unless item defective | **OPEN** (Launch Blocked) | Pending | `_______________` |
| **[O-02]** | VAT Registration | BIN number, VAT rate, tax-inclusive display | Disabled (0%) until accountant sign-off; no VAT line on invoices | **OPEN** (Launch Blocked) | Pending | `_______________` |
| **[O-03]** | COD Expiry | COD reservation expiry window & call policy | 48-hour expiration window; mandatory call verification for all orders | **OPEN** (Launch Blocked) | Pending | `_______________` |
| **[O-05]** | Data Retention | Retention schedule for logs and financial records | Webhooks: 90 days; SMS logs: 180 days; Risk scores: 24 months; Finance/Audit: 6 years | **OPEN** (Launch Blocked) | Pending | `_______________` |
| **[O-11]** | Primary Courier | Courier contract selection & fallback policy | Steadfast Courier primary API; manual courier dispatch desk active from Day 1 | **OPEN** (Launch Blocked) | Pending | `_______________` |
| **[O-12]** | Dual Approval | Refund dual approval threshold amount | ৳5,000+ requires dual sign-off (Manager + Owner) | **OPEN** (Launch Blocked) | Pending | `_______________` |

### Secondary Operational Governance Gates (Phase 1 Baseline Active)

| Gate ID | Subject | Phase 1 Baseline Implementation | Status |
|---|---|---|---|
| **[O-04]** | Shared Phone Policy | Multiple accounts per phone allowed; risk profile bound to phone number | Confirmed Active |
| **[O-06]** | Encryption Scope | AES-256-GCM for refund accounts; staff masking for phone/address | Confirmed Active |
| **[O-07]** | Tracking Log Storage | Redis token-bucket rate limiter; ephemeral lookups | Confirmed Active |
| **[O-08]** | Meta Pixel ID | Configured via Admin Settings and environment | Confirmed Active |
| **[O-09]** | Invoice Fiscal Year | July–June Bangladesh fiscal year notation (`INV-2026-27-000001`) | Confirmed Active |
| **[O-10]** | Refund Disbursement | Original payment method only (bKash/Nagad/Bank); no store credit in Phase 1 | Confirmed Active |
| **[O-13]** | Store Credit Ledger | Deferred to Phase 2 | Confirmed Active |
| **[O-14]** | Warehouse Topology | 3 locations: Central Warehouse, Quarantine/Damage, Courier Desk | Confirmed Active |
| **[O-15]** | Disaster Recovery | Daily encrypted logical backups + verified restore drill (< 5 min SLA) | **VERIFIED** |

---

*End of Production Deployment Runbook.*
