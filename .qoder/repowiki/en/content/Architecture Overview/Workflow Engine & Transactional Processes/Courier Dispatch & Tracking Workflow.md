# Courier Dispatch & Tracking Workflow

<cite>
**Referenced Files in This Document**
- [service.ts](file://apps/medusa/src/modules/bd-courier/service.ts)
- [index.ts](file://apps/medusa/src/modules/bd-courier/index.ts)
- [courier-shipment-log.ts](file://apps/medusa/src/modules/bd-courier/models/courier-shipment-log.ts)
- [courier-webhook-log.ts](file://apps/medusa/src/modules/bd-courier/models/courier-webhook-log.ts)
- [Migration20261024060541.ts](file://apps/medusa/src/modules/bd-courier/migrations/Migration20261024060541.ts)
- [delivery-zone-config.ts](file://apps/medusa/src/modules/bd-settings/models/delivery-zone-config.ts)
- [dfd.md](file://docs/dfd.md)
- [technical-plan.md](file://technical-plan.md)
- [quality-checklist.md](file://quality-checklist.md)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
This document explains the courier dispatch and tracking workflow for the Bangladesh commerce platform. It covers automated courier selection based on delivery zones, shipment creation, tracking number generation, real-time status updates via webhooks, delivery confirmation processes, exception handling for failed deliveries, integration patterns with multiple couriers (Steadfast, Pathao, RedX), tracking synchronization, and delivery zone optimization.

The system is designed around a Medusa v2 module that persists courier interactions and webhook events, while higher-level design documents describe the end-to-end fulfillment flow, including order state transitions, SMS notifications, COD reconciliation, and RTO handling.

## Project Structure
The courier domain is implemented as a Medusa module under `apps/medusa/src/modules/bd-courier`. The module exposes a service backed by two core tables:
- `courier_shipment_log`: records outbound API calls to couriers during booking, cancellation, or rebooking.
- `courier_webhook_log`: records inbound webhook events from couriers for tracking and settlement.

Delivery zone configuration lives in a separate settings module and provides flat rates, free shipping thresholds, delivery day ranges, and district coverage metadata used by routing logic.

```mermaid
graph TB
subgraph "Medusa Backend"
BD_COURIER["BD Courier Module<br/>Service + Models"]
SETTINGS["BD Settings Module<br/>Delivery Zone Config"]
end
subgraph "External Providers"
STEADFAST["Steadfast API"]
PATHAO["Pathao API"]
REDX["RedX API"]
end
subgraph "Infrastructure"
DB["PostgreSQL"]
QUEUE["Redis BullMQ"]
end
BD_COURIER --> DB
SETTINGS --> DB
BD_COURIER --> STEADFAST
BD_COURIER --> PATHAO
BD_COURIER --> REDX
BD_COURIER --> QUEUE
```

**Diagram sources**
- [service.ts:1-11](file://apps/medusa/src/modules/bd-courier/service.ts#L1-L11)
- [courier-shipment-log.ts:1-15](file://apps/medusa/src/modules/bd-courier/models/courier-shipment-log.ts#L1-L15)
- [courier-webhook-log.ts:1-16](file://apps/medusa/src/modules/bd-courier/models/courier-webhook-log.ts#L1-L16)
- [delivery-zone-config.ts:1-17](file://apps/medusa/src/modules/bd-settings/models/delivery-zone-config.ts#L1-L17)
- [technical-plan.md:549-593](file://technical-plan.md#L549-L593)

**Section sources**
- [service.ts:1-11](file://apps/medusa/src/modules/bd-courier/service.ts#L1-L11)
- [index.ts:1-9](file://apps/medusa/src/modules/bd-courier/index.ts#L1-L9)
- [courier-shipment-log.ts:1-15](file://apps/medusa/src/modules/bd-courier/models/courier-shipment-log.ts#L1-L15)
- [courier-webhook-log.ts:1-16](file://apps/medusa/src/modules/bd-courier/models/courier-webhook-log.ts#L1-L16)
- [delivery-zone-config.ts:1-17](file://apps/medusa/src/modules/bd-settings/models/delivery-zone-config.ts#L1-L17)
- [technical-plan.md:549-593](file://technical-plan.md#L549-L593)

## Core Components
- **BD Courier Module Service**: A Medusa service exposing repository methods for `CourierShipmentLog` and `CourierWebhookLog`. It is the operational entry point for logging courier interactions and webhook ingestion.
- **Courier Shipment Log Model**: Stores outbound requests and responses when creating, canceling, or updating parcels with courier providers. Includes fields for action type, payloads, HTTP status codes, and error messages.
- **Courier Webhook Log Model**: Stores inbound webhook events from couriers, including event type, consignment/tracking identifiers, raw payload, signature verification result, processing status, and error messages.
- **Delivery Zone Configuration Model**: Defines delivery zones (`inside_dhaka`, `dhaka_suburbs`, `outside_dhaka`) with pricing, thresholds, delivery windows, activity flags, and district coverage JSON.

These components together support:
- Automated courier selection using delivery zone rules.
- Shipment creation and tracking code generation.
- Webhook ingestion and status synchronization.
- Exception handling for failed deliveries and RTO flows.

**Section sources**
- [service.ts:1-11](file://apps/medusa/src/modules/bd-courier/service.ts#L1-L11)
- [courier-shipment-log.ts:1-15](file://apps/medusa/src/modules/bd-courier/models/courier-shipment-log.ts#L1-L15)
- [courier-webhook-log.ts:1-16](file://apps/medusa/src/modules/bd-courier/models/courier-webhook-log.ts#L1-L16)
- [delivery-zone-config.ts:1-17](file://apps/medusa/src/modules/bd-settings/models/delivery-zone-config.ts#L1-L17)

## Architecture Overview
The courier workflow spans three layers:
1. **Order Readiness**: Orders transition to `ready_to_ship` after payment and COD confirmation.
2. **Dispatch & Booking**: The system selects a courier adapter (Steadfast, Pathao, RedX), maps address fields, creates a parcel, and persists tracking metadata.
3. **Tracking & Settlement**: Webhooks update shipment states; full or partial COD collection is reconciled; failed deliveries trigger call center alerts or RTO workflows.

```mermaid
sequenceDiagram
participant Admin as "Admin UI"
participant API as "Medusa API"
participant Router as "Courier Router Engine"
participant Adapter as "Courier Adapter"
participant Provider as "Courier External API"
participant DB as "PostgreSQL"
participant Queue as "Redis BullMQ"
Admin->>API : "Send to Courier"
API->>Router : Resolve courier by delivery zone
Router->>Adapter : Format parcel payload
Adapter->>Provider : Create parcel / generate consignment
Provider-->>Adapter : Return consignment_id + tracking_code
Adapter-->>Router : Consignment details
Router->>DB : Persist tracking_code & shipment_state = dispatched
Router->>Queue : Enqueue customer SMS with tracking link
Note over Provider,API : Webhooks later update status
```

**Diagram sources**
- [technical-plan.md:549-593](file://technical-plan.md#L549-L593)
- [dfd.md:298-303](file://docs/dfd.md#L298-L303)

## Detailed Component Analysis

### Delivery Zone Optimization and Courier Selection
Delivery zones are configured centrally and include:
- Zone codes: `inside_dhaka`, `dhaka_suburbs`, `outside_dhaka`.
- Pricing: flat rate BDT and free shipping threshold.
- Delivery windows: minimum and maximum days.
- Coverage: optional district list in JSON.

Routing logic uses these attributes to select an appropriate courier provider. The technical plan defines a standardized adapter interface for Steadfast, Pathao, and RedX, enabling pluggable integrations without changing order workflows.

```mermaid
flowchart TD
Start(["Order Ready to Ship"]) --> ReadZone["Read Delivery Zone Config"]
ReadZone --> CheckCoverage{"District in Coverage?"}
CheckCoverage --> |Yes| SelectProvider["Select Preferred Provider"]
CheckCoverage --> |No| FallbackProvider["Fallback Provider or Manual"]
SelectProvider --> MapAddress["Map Address Fields<br/>Pathao: city_id + zone_id<br/>Steadfast: district + thana"]
FallbackProvider --> MapAddress
MapAddress --> BookParcel["Create Parcel via Adapter"]
BookParcel --> End(["Consignment Created"])
```

**Diagram sources**
- [delivery-zone-config.ts:1-17](file://apps/medusa/src/modules/bd-settings/models/delivery-zone-config.ts#L1-L17)
- [technical-plan.md:549-593](file://technical-plan.md#L549-L593)
- [dfd.md:298-303](file://docs/dfd.md#L298-L303)

**Section sources**
- [delivery-zone-config.ts:1-17](file://apps/medusa/src/modules/bd-settings/models/delivery-zone-config.ts#L1-L17)
- [technical-plan.md:549-593](file://technical-plan.md#L549-L593)
- [dfd.md:298-303](file://docs/dfd.md#L298-L303)

### Shipment Creation and Tracking Number Generation
When dispatch is initiated:
- The router resolves the correct courier adapter based on delivery zone and business rules.
- The adapter formats the parcel payload according to the provider’s schema.
- The external courier API returns a consignment ID and tracking code.
- The system persists tracking metadata and updates the order’s shipment state to `dispatched`.
- An SMS notification is enqueued to inform the customer with a tracking link.

```mermaid
sequenceDiagram
participant API as "Medusa API"
participant Router as "Courier Router Engine"
participant Adapter as "Courier Adapter"
participant Provider as "Courier External API"
participant DB as "PostgreSQL"
participant Queue as "Redis BullMQ"
API->>Router : Dispatch order
Router->>Adapter : createParcel(order)
Adapter->>Provider : POST consignment payload
Provider-->>Adapter : {consignment_id, tracking_code}
Adapter-->>Router : Consignment details
Router->>DB : Save tracking_code, set shipment_state = dispatched
Router->>Queue : Enqueue SMS with tracking URL
```

**Diagram sources**
- [technical-plan.md:549-593](file://technical-plan.md#L549-L593)
- [dfd.md:298-303](file://docs/dfd.md#L298-L303)

**Section sources**
- [technical-plan.md:549-593](file://technical-plan.md#L549-L593)
- [dfd.md:298-303](file://docs/dfd.md#L298-L303)

### Webhook Handling for Courier Status Changes
Inbound webhooks are ingested, validated, and processed:
- Signature verification ensures authenticity.
- Event types such as `delivery_failed` and `rto_initiated` are differentiated.
- Successful webhooks update shipment states and may trigger call center alerts or warehouse actions.
- All webhook events are persisted in `courier_webhook_log` with signature verification results and processing status.

```mermaid
sequenceDiagram
participant Provider as "Courier External API"
participant API as "Medusa API"
participant Validator as "Signature Verifier"
participant Processor as "Webhook Processor"
participant DB as "PostgreSQL"
participant Queue as "Redis BullMQ"
Provider->>API : POST webhook payload + signature
API->>Validator : Verify HMAC/Bearer signature
alt Invalid Signature
Validator-->>API : Reject 401
API->>DB : Log security alert
else Valid Signature
Validator-->>API : Proceed
API->>Processor : Process event_type
Processor->>DB : Update shipment state (e.g., delivered, RTO)
Processor->>Queue : Enqueue relevant SMS/alerts
end
```

**Diagram sources**
- [courier-webhook-log.ts:1-16](file://apps/medusa/src/modules/bd-courier/models/courier-webhook-log.ts#L1-L16)
- [dfd.md:298-303](file://docs/dfd.md#L298-L303)

**Section sources**
- [courier-webhook-log.ts:1-16](file://apps/medusa/src/modules/bd-courier/models/courier-webhook-log.ts#L1-L16)
- [dfd.md:298-303](file://docs/dfd.md#L298-L303)

### Delivery Confirmation and Partial COD Collection
On delivery:
- Full COD collection marks the order as delivered and captures the full COD amount.
- Partial COD collection records actual cash collected, triggers return requests for rejected items, and routes variance to financial reconciliation.
- Webhook-driven updates ensure consistency between courier status and internal order state.

```mermaid
flowchart TD
Start(["DELIVERED Webhook"]) --> CheckAmount{"Collection Amount == Total COD?"}
CheckAmount --> |Yes| FullDeliv["Mark Delivered<br/>Capture Full COD<br/>Enqueue Delivery SMS"]
CheckAmount --> |No| PartialDeliv["Mark Delivered<br/>Capture Actual Collected<br/>Create Return Request<br/>Route Variance"]
FullDeliv --> End(["Settlement Updated"])
PartialDeliv --> End
```

**Diagram sources**
- [dfd.md:298-303](file://docs/dfd.md#L298-L303)
- [quality-checklist.md:390-398](file://quality-checklist.md#L390-L398)

**Section sources**
- [dfd.md:298-303](file://docs/dfd.md#L298-L303)
- [quality-checklist.md:390-398](file://quality-checklist.md#L390-L398)

### Exception Handling for Failed Deliveries and RTO
Exception handling differentiates between:
- `delivery_failed`: Re-attempt next day and alert Call Center.
- `rto_initiated`: Initiate return to merchant and alert Warehouse.
- RTO received: Move items to quarantine; do not auto-restock; require manual inspection before sellable inventory adjustment.

```mermaid
flowchart TD
Start(["Failed Delivery / RTO Webhook"]) --> EventType{"Event Type"}
EventType --> |delivery_failed| Retry["Schedule Re-attempt Tomorrow<br/>Alert Call Center"]
EventType --> |rto_initiated| RTOStart["Initiate Return to Merchant<br/>Alert Warehouse"]
RTOStart --> Quarantine["Move Items to Quarantine<br/>Await Manual Inspection"]
Retry --> End(["Operational Actions Logged"])
Quarantine --> End
```

**Diagram sources**
- [dfd.md:298-303](file://docs/dfd.md#L298-L303)
- [quality-checklist.md:390-398](file://quality-checklist.md#L390-L398)

**Section sources**
- [dfd.md:298-303](file://docs/dfd.md#L298-L303)
- [quality-checklist.md:390-398](file://quality-checklist.md#L390-L398)

### Integration Patterns with Multiple Couriers
The system supports multiple courier providers through a standardized adapter interface:
- **Steadfast**: Implements parcel booking via order creation endpoint and webhook processing.
- **Pathao**: Implements store address mapping, city/zone resolution, dispatch, and tracking.
- **RedX**: Supported via the same adapter contract.
- **Manual Fallback**: Allows staff to input custom courier name and receipt number when automation is unavailable.

```mermaid
classDiagram
class CourierProviderAdapter {
+createParcel(order) Promise
+trackParcel(trackingCode) Promise
+handleWebhook(payload, signature) Promise
}
class SteadfastAdapter {
+createParcel(order)
+handleWebhook(payload, signature)
}
class PathaoAdapter {
+createParcel(order)
+trackParcel(trackingCode)
}
class RedXAdapter {
+createParcel(order)
+handleWebhook(payload, signature)
}
CourierProviderAdapter <|-- SteadfastAdapter
CourierProviderAdapter <|-- PathaoAdapter
CourierProviderAdapter <|-- RedXAdapter
```

**Diagram sources**
- [technical-plan.md:549-593](file://technical-plan.md#L549-L593)

**Section sources**
- [technical-plan.md:549-593](file://technical-plan.md#L549-L593)

### Data Persistence and Auditability
Two primary log models provide auditability and troubleshooting capability:
- `courier_shipment_log`: Outbound API logs with request/response payloads, status codes, and errors.
- `courier_webhook_log`: Inbound webhook logs with event type, identifiers, raw payload, signature verification, processing status, and error messages.

```mermaid
erDiagram
COURIER_SHIPMENT_LOG {
text id PK
text order_id
text courier
text action
json request_payload
json response_payload
integer status_code
text error_message
}
COURIER_WEBHOOK_LOG {
text id PK
text courier
text event_type
text consignment_id
text tracking_code
json raw_payload
boolean signature_verified
boolean processed
text error_message
}
```

**Diagram sources**
- [courier-shipment-log.ts:1-15](file://apps/medusa/src/modules/bd-courier/models/courier-shipment-log.ts#L1-L15)
- [courier-webhook-log.ts:1-16](file://apps/medusa/src/modules/bd-courier/models/courier-webhook-log.ts#L1-L16)

**Section sources**
- [courier-shipment-log.ts:1-15](file://apps/medusa/src/modules/bd-courier/models/courier-shipment-log.ts#L1-L15)
- [courier-webhook-log.ts:1-16](file://apps/medusa/src/modules/bd-courier/models/courier-webhook-log.ts#L1-L16)

## Dependency Analysis
The courier module depends on:
- **Medusa Framework**: Provides service scaffolding and ORM utilities.
- **Database Layer**: PostgreSQL tables created by migrations for shipment and webhook logs.
- **Settings Module**: Delivery zone configuration used by routing logic.
- **External APIs**: Steadfast, Pathao, RedX for parcel creation and tracking.
- **Background Jobs**: Redis BullMQ for SMS and asynchronous operations.

```mermaid
graph LR
SERVICE["BdCourierModuleService"] --> SHIPMENT_LOG["CourierShipmentLog"]
SERVICE --> WEBHOOK_LOG["CourierWebhookLog"]
ROUTER["Courier Router Engine"] --> ADAPTERS["Steadfast / Pathao / RedX Adapters"]
SETTINGS["DeliveryZoneConfig"] --> ROUTER
ROUTER --> QUEUE["Redis BullMQ"]
```

**Diagram sources**
- [service.ts:1-11](file://apps/medusa/src/modules/bd-courier/service.ts#L1-L11)
- [courier-shipment-log.ts:1-15](file://apps/medusa/src/modules/bd-courier/models/courier-shipment-log.ts#L1-L15)
- [courier-webhook-log.ts:1-16](file://apps/medusa/src/modules/bd-courier/models/courier-webhook-log.ts#L1-L16)
- [delivery-zone-config.ts:1-17](file://apps/medusa/src/modules/bd-settings/models/delivery-zone-config.ts#L1-L17)
- [technical-plan.md:549-593](file://technical-plan.md#L549-L593)

**Section sources**
- [service.ts:1-11](file://apps/medusa/src/modules/bd-courier/service.ts#L1-L11)
- [technical-plan.md:549-593](file://technical-plan.md#L549-L593)

## Performance Considerations
- **Indexing**: Database indexes on `order_id`, `consignment_id`, and `tracking_code` improve query performance for order lookups and webhook reconciliation.
- **Idempotency**: Webhook processors should be idempotent to avoid duplicate state changes on retries.
- **Rate Limiting**: SMS and webhook endpoints should enforce rate limits to prevent overload.
- **Asynchronous Processing**: Use background jobs for non-critical tasks like SMS dispatch and reporting to keep API latency low.
- **Caching**: Cache delivery zone configurations and courier availability to reduce database and external API load.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- **Invalid Webhook Signature**: Ensure HMAC/Bearer signature validation is correctly configured per courier provider.
- **Missing Tracking Code**: Verify adapter mapping for address fields (city_id/zone_id for Pathao; district/thana for Steadfast).
- **Duplicate State Updates**: Implement idempotency keys or unique constraints on webhook processing.
- **Partial COD Discrepancies**: Review webhook payloads and reconcile actual collected amounts against expected totals.
- **RTO Inventory Flow**: Confirm quarantine placement and manual inspection steps before restocking.

Use the following logs for diagnosis:
- `courier_shipment_log`: Inspect outbound requests, status codes, and error messages.
- `courier_webhook_log`: Inspect incoming events, signature verification results, and processing outcomes.

**Section sources**
- [courier-shipment-log.ts:1-15](file://apps/medusa/src/modules/bd-courier/models/courier-shipment-log.ts#L1-L15)
- [courier-webhook-log.ts:1-16](file://apps/medusa/src/modules/bd-courier/models/courier-webhook-log.ts#L1-L16)

## Conclusion
The courier dispatch and tracking workflow integrates delivery zone configuration, multi-provider courier adapters, robust webhook ingestion, and comprehensive audit logging. It supports automated courier selection, shipment creation, tracking synchronization, and exception handling for failed deliveries and RTO flows. The modular design enables scalable integration with additional providers and maintains clear separation between operational persistence and external integrations.

[No sources needed since this section summarizes without analyzing specific files]