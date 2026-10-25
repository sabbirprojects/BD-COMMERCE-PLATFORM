# Payment Processing Module

<cite>
**Referenced Files in This Document**
- [index.ts](file://apps/medusa/src/modules/bd-payments/index.ts)
- [service.ts](file://apps/medusa/src/modules/bd-payments/service.ts)
- [payment-transaction.ts](file://apps/medusa/src/modules/bd-payments/models/payment-transaction.ts)
- [payment-webhook-log.ts](file://apps/medusa/src/modules/bd-payments/models/payment-webhook-log.ts)
- [Migration20261024060542.ts](file://apps/medusa/src/modules/bd-payments/migrations/Migration20261024060542.ts)
- [route.ts (store)](file://apps/medusa/src/api/store/custom/route.ts)
- [route.ts (admin)](file://apps/medusa/src/api/admin/custom/route.ts)
- [technical-plan.md](file://technical-plan.md)
- [prd.md](file://prd.md)
- [architecture.md](file://docs/architecture.md)
- [dfd.md](file://dfd.md)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Security, Verification, and Reconciliation](#security-verification-and-reconciliation)
9. [Troubleshooting Guide](#troubleshooting-guide)
10. [Conclusion](#conclusion)

## Introduction
This document explains the BD Payments module within the Bangladesh commerce platform. The module is a Medusa v2 custom module that provides:
- Multi-payment method support for Cash on Delivery, bKash, and Nagad.
- Transaction tracking through a dedicated payment transaction table.
- Webhook logging infrastructure for provider callbacks.
- A zero-orphan payment redirect architecture designed to avoid orphan orders and dangling inventory when customers abandon or lose connectivity during online gateway flows.

At this stage, the repository contains the module skeleton, data models, migration, and design documentation. Concrete provider SDK calls, webhook handlers, and admin/store endpoints are not yet implemented in source code; they are defined by requirements and technical plans.

## Project Structure
The BD Payments module lives under `apps/medusa/src/modules/bd-payments`. It follows Medusa’s module pattern:
- An entry point exports the module name and service.
- A service extends `MedusaService` with the module’s entities.
- Entities define database tables for transactions and webhook logs.
- A migration creates the actual database schema.

```mermaid
graph TB
subgraph "Medusa App"
StoreRoute["Store Custom Route"]
AdminRoute["Admin Custom Route"]
end
subgraph "BD Payments Module"
ModuleIndex["Module Index<br/>Exports module name and service"]
Service["BdPaymentsModuleService<br/>CRUD over entities"]
TxModel["PaymentTransaction Model"]
WebhookLogModel["PaymentWebhookLog Model"]
Migration["Database Migration"]
end
StoreRoute --> Service
AdminRoute --> Service
ModuleIndex --> Service
Service --> TxModel
Service --> WebhookLogModel
Migration --> TxModel
Migration --> WebhookLogModel
```

**Diagram sources**
- [index.ts:1-9](file://apps/medusa/src/modules/bd-payments/index.ts#L1-L9)
- [service.ts:1-11](file://apps/medusa/src/modules/bd-payments/service.ts#L1-L11)
- [payment-transaction.ts:1-18](file://apps/medusa/src/modules/bd-payments/models/payment-transaction.ts#L1-L18)
- [payment-webhook-log.ts:1-18](file://apps/medusa/src/modules/bd-payments/models/payment-webhook-log.ts#L1-L18)
- [Migration20261024060542.ts:1-23](file://apps/medusa/src/modules/bd-payments/migrations/Migration20261024060542.ts#L1-L23)

**Section sources**
- [index.ts:1-9](file://apps/medusa/src/modules/bd-payments/index.ts#L1-L9)
- [service.ts:1-11](file://apps/medusa/src/modules/bd-payments/service.ts#L1-L11)
- [Migration20261024060542.ts:1-23](file://apps/medusa/src/modules/bd-payments/migrations/Migration20261024060542.ts#L1-L23)

## Core Components
The module exposes three core building blocks:

| Component | Purpose | Current State |
|---|---|---|
| Module index | Registers `bd_payments` and wires the service into Medusa | Implemented |
| Service | Provides CRUD operations over payment transactions and webhook logs via `MedusaService` | Implemented as a thin wrapper |
| Data models | Define `payment_transaction` and `payment_webhook_log` tables | Implemented |
| Migration | Creates tables, indexes, constraints, and soft-delete columns | Implemented |

Key model characteristics:
- `PaymentTransaction` tracks provider ID, transaction type, BDT amount, gateway identifiers, gateway status, raw response payload, and whether server-to-server verification was performed.
- `PaymentWebhookLog` records provider, endpoint, HTTP method, headers, payload, IP address, signature validation result, processing state, and error messages.

**Section sources**
- [service.ts:1-11](file://apps/medusa/src/modules/bd-payments/service.ts#L1-L11)
- [payment-transaction.ts:1-18](file://apps/medusa/src/modules/bd-payments/models/payment-transaction.ts#L1-L18)
- [payment-webhook-log.ts:1-18](file://apps/medusa/src/modules/bd-payments/models/payment-webhook-log.ts#L1-L18)
- [Migration20261024060542.ts:1-23](file://apps/medusa/src/modules/bd-payments/migrations/Migration20261024060542.ts#L1-L23)

## Architecture Overview
The intended payment architecture centers on a zero-orphan redirect flow for online providers and a deferred capture model for COD.

### High-Level Flow
```mermaid
sequenceDiagram
participant Customer as "Customer"
participant Storefront as "Next.js Storefront"
participant API as "Medusa Backend"
participant Provider as "bKash / Nagad Gateway"
participant DB as "PostgreSQL"
Customer->>Storefront : Select bKash or Nagad at checkout
Storefront->>API : Initialize payment session
API->>Provider : Create payment request with BDT amount and callback URL
Provider-->>API : Return redirect URL
API-->>Storefront : Redirect URL (no order created yet)
Storefront->>Provider : Browser redirects to provider page
Provider-->>API : Callback with payment identifier
API->>Provider : Server-to-server verify payment
Provider-->>API : Verified completed transaction
API->>DB : Record transaction and create order if verified
API-->>Storefront : Redirect to order confirmation
```

**Diagram sources**
- [prd.md:267-274](file://prd.md#L267-L274)
- [architecture.md:467-478](file://docs/architecture.md#L467-L478)
- [dfd.md:284-394](file://dfd.md#L284-L394)

### Zero-Orphan Design Rules
- Online payments initialize only a payment session before redirecting.
- No Medusa Order is created until server-to-server verification succeeds.
- If the customer cancels or abandons the gateway, the cart remains open and no order or stock reservation is created.
- Dropped browser callbacks are recovered by a background polling worker that queries provider status and completes order placement asynchronously.

**Section sources**
- [prd.md:267-274](file://prd.md#L267-L274)
- [architecture.md:467-478](file://docs/architecture.md#L467-L478)
- [dfd.md:284-394](file://dfd.md#L284-L394)

## Detailed Component Analysis

### Payment Transaction Model
The transaction model captures every provider interaction needed for reconciliation and auditability.

```mermaid
classDiagram
class PaymentTransaction {
+string id
+string order_id
+string payment_session_id
+enum provider_id
+enum transaction_type
+number amount_bdt
+string currency_code
+string gateway_transaction_id
+string gateway_status
+json gateway_response_json
+boolean is_verified_server_to_server
}
```

**Diagram sources**
- [payment-transaction.ts:1-18](file://apps/medusa/src/modules/bd-payments/models/payment-transaction.ts#L1-L18)
- [Migration20261024060542.ts:5-10](file://apps/medusa/src/modules/bd-payments/migrations/Migration20261024060542.ts#L5-L10)

Important fields and constraints:
- `provider_id` supports `pp_cod`, `pp_bkash`, and `pp_nagad`.
- `transaction_type` supports authorization, capture, refund, and status query.
- Amounts are stored in BDT with a default currency code.
- Gateway identifiers and responses are persisted for traceability.
- A flag indicates whether server-to-server verification was performed.
- The migration adds indexes on `order_id`, `payment_session_id`, and `gateway_transaction_id`, plus soft-delete support.

**Section sources**
- [payment-transaction.ts:1-18](file://apps/medusa/src/modules/bd-payments/models/payment-transaction.ts#L1-L18)
- [Migration20261024060542.ts:5-10](file://apps/medusa/src/modules/bd-payments/migrations/Migration20261024060542.ts#L5-L10)

### Webhook Log Model
The webhook log model records incoming provider notifications for auditing and debugging.

```mermaid
classDiagram
class PaymentWebhookLog {
+string id
+string provider
+string endpoint
+string http_method
+json headers_json
+json payload_json
+string ip_address
+boolean signature_valid
+string verification_result
+boolean processed
+string error_message
}
```

**Diagram sources**
- [payment-webhook-log.ts:1-18](file://apps/medusa/src/modules/bd-payments/models/payment-webhook-log.ts#L1-L18)
- [Migration20261024060542.ts:12-13](file://apps/medusa/src/modules/bd-payments/migrations/Migration20261024060542.ts#L12-L13)

Design notes:
- Stores provider name, endpoint, HTTP method, headers, payload, and client IP.
- Tracks signature validation and processing outcome.
- Includes an error message field for failed processing.
- Uses soft delete and timestamps.

**Section sources**
- [payment-webhook-log.ts:1-18](file://apps/medusa/src/modules/bd-payments/models/payment-webhook-log.ts#L1-L18)
- [Migration20261024060542.ts:12-13](file://apps/medusa/src/modules/bd-payments/migrations/Migration20261024060542.ts#L12-L13)

### Module Entry Point and Service
The module registers itself with Medusa and exposes a service that manages the two entities.

```mermaid
flowchart TD
Start(["Medusa Bootstraps"]) --> LoadModule["Load bd_payments module"]
LoadModule --> RegisterService["Register BdPaymentsModuleService"]
RegisterService --> EntityMap["Bind PaymentTransaction and PaymentWebhookLog"]
EntityMap --> Ready(["Module Ready"])
```

**Diagram sources**
- [index.ts:1-9](file://apps/medusa/src/modules/bd-payments/index.ts#L1-L9)
- [service.ts:1-11](file://apps/medusa/src/modules/bd-payments/service.ts#L1-L11)

Current implementation:
- The module name is `bd_payments`.
- The service extends `MedusaService` with both entities.
- No custom business logic is present yet; it relies on Medusa’s generated CRUD methods.

**Section sources**
- [index.ts:1-9](file://apps/medusa/src/modules/bd-payments/index.ts#L1-L9)
- [service.ts:1-11](file://apps/medusa/src/modules/bd-payments/service.ts#L1-L11)

### API Route Placeholders
Both store and admin custom routes currently return a simple success response. They are placeholders for future payment initiation, configuration, and webhook handling endpoints.

```mermaid
flowchart TD
Client["Client Request"] --> StoreRoute["Store Custom Route"]
Client --> AdminRoute["Admin Custom Route"]
StoreRoute --> Response200["HTTP 200 OK"]
AdminRoute --> Response200
```

**Diagram sources**
- [route.ts (store):1-9](file://apps/medusa/src/api/store/custom/route.ts#L1-L9)
- [route.ts (admin):1-9](file://apps/medusa/src/api/admin/custom/route.ts#L1-L9)

**Section sources**
- [route.ts (store):1-9](file://apps/medusa/src/api/store/custom/route.ts#L1-L9)
- [route.ts (admin):1-9](file://apps/medusa/src/api/admin/custom/route.ts#L1-L9)

### Provider Integration Patterns

#### Cash on Delivery
- Provider ID: `pp_cod`.
- Authorization behavior: immediate success with authorized status; amount recorded as pending collection.
- Capture behavior: automatic upon courier delivery webhook or manual staff action.

```mermaid
flowchart TD
Start(["COD Order Created"]) --> Authorize["Authorize Immediately<br/>Status: Authorized"]
Authorize --> PendingCollection["Pending Collection"]
PendingCollection --> DeliveryEvent{"Courier Delivered?"}
DeliveryEvent --> |Yes| Capture["Capture Payment"]
DeliveryEvent --> |No| Wait["Await Delivery Event"]
Capture --> Complete(["Order Paid"])
Wait --> Capture
```

**Diagram sources**
- [technical-plan.md:535-538](file://technical-plan.md#L535-L538)
- [payment-transaction.ts:7-8](file://apps/medusa/src/modules/bd-payments/models/payment-transaction.ts#L7-L8)

**Section sources**
- [technical-plan.md:535-538](file://technical-plan.md#L535-L538)

#### bKash
- Provider ID: `pp_bkash`.
- Protocol:
  - Authorization calls the provider’s create payment endpoint with order ID, BDT amount, and callback URL.
  - Returns a redirect URL or gateway URL.
  - Capture verifies completed status, currency equals BDT, and exact amount.
  - Stores gateway transaction identifiers and wallet information in session data.

```mermaid
sequenceDiagram
participant Storefront as "Storefront"
participant API as "Backend"
participant BKash as "bKash Gateway"
Storefront->>API : Initiate payment with order ID and BDT amount
API->>BKash : Create payment request
BKash-->>API : Redirect URL
API-->>Storefront : Redirect URL
Storefront->>BKash : Customer completes PIN/OTP
BKash-->>API : Callback with payment identifier
API->>BKash : Execute payment and verify status
BKash-->>API : Completed transaction with trxID and amount
API-->>Storefront : Redirect to confirmation after verification
```

**Diagram sources**
- [technical-plan.md:539-544](file://technical-plan.md#L539-L544)
- [prd.md:267-274](file://prd.md#L267-L274)

**Section sources**
- [technical-plan.md:539-544](file://technical-plan.md#L539-L544)
- [prd.md:267-274](file://prd.md#L267-L274)

#### Nagad
- Provider ID: `pp_nagad`.
- Protocol:
  - Generates a cryptographic payload signed with the merchant private key.
  - Calls the provider’s checkout initialization endpoint.
  - Handles payment verification callback using the provider’s public key.

```mermaid
sequenceDiagram
participant Storefront as "Storefront"
participant API as "Backend"
participant Nagad as "Nagad Gateway"
Storefront->>API : Initiate payment
API->>API : Sign payload with merchant private key
API->>Nagad : Initialize checkout
Nagad-->>API : Redirect URL
API-->>Storefront : Redirect URL
Storefront->>Nagad : Customer completes payment
Nagad-->>API : Callback with signature
API->>API : Verify signature with provider public key
API->>Nagad : Verify transaction status
Nagad-->>API : Confirmed transaction
API-->>Storefront : Redirect to confirmation
```

**Diagram sources**
- [technical-plan.md:545-547](file://technical-plan.md#L545-L547)

**Section sources**
- [technical-plan.md:545-547](file://technical-plan.md#L545-L547)

#### SSLCommerz and Stripe
- Not present in the current module models or migrations.
- No provider IDs, transaction types, or integration code exist for SSLCommerz or Stripe in the repository.
- These providers would require new enum values, provider-specific services, webhook handlers, and configuration management before being supported.

[No sources needed since this section confirms absence rather than analyzing specific files]

## Dependency Analysis
The BD Payments module has minimal internal coupling and clear external boundaries.

```mermaid
graph LR
MedusaFramework["@medusajs/framework"] --> ModuleIndex["Module Index"]
MedusaFramework --> Service["BdPaymentsModuleService"]
Service --> TxModel["PaymentTransaction"]
Service --> WebhookLogModel["PaymentWebhookLog"]
Migration["Migration"] --> TxModel
Migration --> WebhookLogModel
```

**Diagram sources**
- [index.ts:1-9](file://apps/medusa/src/modules/bd-payments/index.ts#L1-L9)
- [service.ts:1-11](file://apps/medusa/src/modules/bd-payments/service.ts#L1-L11)
- [payment-transaction.ts:1-18](file://apps/medusa/src/modules/bd-payments/models/payment-transaction.ts#L1-L18)
- [payment-webhook-log.ts:1-18](file://apps/medusa/src/modules/bd-payments/models/payment-webhook-log.ts#L1-L18)
- [Migration20261024060542.ts:1-23](file://apps/medusa/src/modules/bd-payments/migrations/Migration20261024060542.ts#L1-L23)

Observations:
- Cohesion is high within the module: all payment-related persistence is centralized.
- Coupling to Medusa is intentional and expected.
- External provider integrations are not yet wired into the service; they should be added as provider adapters behind the service layer.
- No circular dependencies are visible in the current code.

**Section sources**
- [index.ts:1-9](file://apps/medusa/src/modules/bd-payments/index.ts#L1-L9)
- [service.ts:1-11](file://apps/medusa/src/modules/bd-payments/service.ts#L1-L11)
- [Migration20261024060542.ts:1-23](file://apps/medusa/src/modules/bd-payments/migrations/Migration20261024060542.ts#L1-L23)

## Performance Considerations
- Use indexed lookup fields for frequent queries: `order_id`, `payment_session_id`, and `gateway_transaction_id` are already indexed in the migration.
- Avoid storing large provider payloads directly in primary tables unless necessary; the existing JSON fields can grow quickly and should be monitored.
- Implement idempotent processing for webhooks and retries to prevent duplicate orders or duplicate captures.
- For dropped callback recovery, use a bounded polling window and exponential backoff when querying provider status APIs.
- Separate write-heavy operations such as webhook ingestion from order creation workflows using queues where possible.

[No sources needed since this section provides general guidance]

## Security, Verification, and Reconciliation

### Security Requirements
- Never trust client-side redirect parameters alone. Always perform server-to-server verification with the provider.
- Validate currency is BDT and amounts match expected totals.
- Validate provider signatures using the correct public/private keys per provider.
- Restrict webhook endpoints to trusted IPs where supported by the provider.
- Keep credentials out of source control; manage them through secure configuration.

**Section sources**
- [prd.md:267-274](file://prd.md#L267-L274)

### Payment Verification Flow
```mermaid
flowchart TD
Start(["Incoming Callback"]) --> LogRequest["Log Headers, Payload, IP"]
LogRequest --> ValidateSignature["Validate Provider Signature"]
ValidateSignature --> SignatureValid{"Signature Valid?"}
SignatureValid --> |No| Reject["Reject and Log Error"]
SignatureValid --> |Yes| ServerToServer["Call Provider Status or Execute API"]
ServerToServer --> CheckStatus{"Status Completed?"}
CheckStatus --> |No| Fail["Mark Failed and Log Result"]
CheckStatus --> |Yes| CheckAmount["Verify Currency and Amount"]
CheckAmount --> AmountMatch{"Amount Matches?"}
AmountMatch --> |No| Fail
AmountMatch --> |Yes| IdempotencyCheck["Check Duplicate Transaction"]
IdempotencyCheck --> Duplicate{"Already Processed?"}
Duplicate --> |Yes| Acknowledge["Acknowledge Without Side Effects"]
Duplicate --> |No| UpdateState["Update Transaction and Order State"]
UpdateState --> Complete(["Success"])
Reject --> End(["End"])
Fail --> End
Acknowledge --> End
Complete --> End
```

**Diagram sources**
- [prd.md:267-274](file://prd.md#L267-L274)
- [payment-webhook-log.ts:1-18](file://apps/medusa/src/modules/bd-payments/models/payment-webhook-log.ts#L1-L18)
- [payment-transaction.ts:1-18](file://apps/medusa/src/modules/bd-payments/models/payment-transaction.ts#L1-L18)

### Reconciliation Process
Reconciliation should compare:
- Internal `PaymentTransaction` records.
- Provider transaction reports or export files.
- Courier delivery confirmations for COD.
- Finance settlement statements.

Recommended reconciliation steps:
1. Extract daily provider settlement files.
2. Match provider transaction IDs with `gateway_transaction_id`.
3. Compare captured amounts, currencies, and statuses.
4. Investigate mismatches flagged by `is_verified_server_to_server` and `gateway_status`.
5. Mark discrepancies for manual review and adjust finance records accordingly.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide

### Common Issues and Resolutions

| Issue | Symptom | Likely Cause | Resolution |
|---|---|---|---|
| Dropped browser callback | Payment debited but no order created | Network failure before provider redirect | Enable background polling to query provider status and complete order placement |
| Duplicate webhook processing | Multiple orders or captures | Missing idempotency | Deduplicate by provider transaction ID and process once |
| Wrong amount captured | Order mismatch with cart total | Missing amount/currency validation | Enforce strict BDT amount and currency checks |
| Invalid signature | Webhook rejected | Incorrect provider public key or tampered payload | Verify signature algorithm and keys; reject invalid requests |
| COD not captured | Order remains unpaid after delivery | Missing courier webhook handler or manual capture | Wire courier delivery events to COD capture workflow |
| SSLCommerz or Stripe unavailable | Method not selectable or missing integration | Provider not configured | Add provider configuration and integration before enabling |

**Section sources**
- [prd.md:267-274](file://prd.md#L267-L274)
- [dfd.md:284-394](file://dfd.md#L284-L394)

## Conclusion
The BD Payments module provides a solid foundation for multi-provider payment processing in the Bangladesh commerce platform. It defines the module structure, transaction tracking, and webhook logging, while the project documentation specifies the intended zero-orphan payment flow, provider protocols, and security requirements.

The next implementation priorities are:
- Implement provider adapters for bKash, Nagad, and COD.
- Add store and admin endpoints for payment initiation, configuration, and monitoring.
- Implement webhook handlers with signature verification and idempotent processing.
- Add background polling for dropped callback recovery.
- Extend provider enums and models if SSLCommerz or Stripe are added later.

[No sources needed since this section summarizes without analyzing specific files]