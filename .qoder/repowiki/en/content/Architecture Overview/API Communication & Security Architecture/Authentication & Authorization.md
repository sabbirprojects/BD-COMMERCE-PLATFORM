# Authentication & Authorization

<cite>
**Referenced Files in This Document**
- [medusa-config.ts](file://apps/medusa/medusa-config.ts)
- [middlewares.ts](file://apps/medusa/src/api/middlewares.ts)
- [store-custom-route.ts](file://apps/medusa/src/api/store/custom/route.ts)
- [admin-custom-route.ts](file://apps/medusa/src/api/admin/custom/route.ts)
- [api-readme.md](file://apps/medusa/src/api/README.md)
- [architecture.md](file://docs/architecture.md)
- [technical-plan.md](file://technical-plan.md)
- [staff-role-permission.ts](file://apps/medusa/src/modules/bd-audit/models/staff-role-permission.ts)
- [audit-log.ts](file://apps/medusa/src/modules/bd-audit/models/audit-log.ts)
- [bd-audit-service.ts](file://apps/medusa/src/modules/bd-audit/service.ts)
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
This document explains the authentication and authorization mechanisms used by the BD Commerce Platform backend, which is built on Medusa v2. It covers:
- JWT-based staff authentication and session behavior
- Cart token management for guest and registered customers
- Role-based access control (RBAC) for staff roles and permissions
- Middleware security patterns for store, admin, and webhook routes
- Route namespace policies under `/store/*`, `/admin/*`, and `/hooks/*`
- Custom middleware creation, token validation processes, session management, and permission checking
- Common flows for customers, staff members, and external integrations
- Troubleshooting guidance and security best practices

The platform uses Medusa’s HTTP router, environment-driven configuration, and a custom audit module to model staff roles and permissions. Public storefront endpoints are designed around cart tokens, while admin endpoints require bearer JWTs and RBAC checks. External providers such as bKash, Nagad, and courier services use signature or HMAC verification at `/hooks/*`.

## Project Structure
The authentication-related code is primarily located in:
- Medusa configuration for JWT and cookie secrets
- API middlewares for route-level security
- Store and Admin example route files
- Audit module models and service for RBAC data structures
- Architecture documentation describing route namespaces and security boundaries

```mermaid
graph TB
Config["Medusa Configuration<br/>JWT Secret, Cookie Secret, CORS"] --> Router["Medusa HTTP Router"]
Router --> StoreRoutes["Store Routes<br/>/store/*"]
Router --> AdminRoutes["Admin Routes<br/>/admin/*"]
Router --> HooksRoutes["Webhook Routes<br/>/hooks/*"]
Middlewares["API Middlewares<br/>Route Matchers + Built-in Security"] --> StoreRoutes
Middlewares --> AdminRoutes
Middlewares --> HooksRoutes
AuditModels["Audit Models<br/>StaffRolePermission, AuditLog"] --> RBAC["RBAC Policy Engine"]
RBAC --> AdminRoutes
```

**Diagram sources**
- [medusa-config.ts:7-18](file://apps/medusa/medusa-config.ts#L7-L18)
- [middlewares.ts:1-20](file://apps/medusa/src/api/middlewares.ts#L1-L20)
- [staff-role-permission.ts:1-17](file://apps/medusa/src/modules/bd-audit/models/staff-role-permission.ts#L1-L17)
- [audit-log.ts:1-43](file://apps/medusa/src/modules/bd-audit/models/audit-log.ts#L1-L43)

**Section sources**
- [medusa-config.ts:7-18](file://apps/medusa/medusa-config.ts#L7-L18)
- [middlewares.ts:1-20](file://apps/medusa/src/api/middlewares.ts#L1-L20)
- [architecture.md:305-316](file://docs/architecture.md#L305-L316)

## Core Components
- JWT and Cookie Configuration
  - The backend loads environment variables and configures `jwtSecret` and `cookieSecret` under HTTP settings. These values secure staff JWT sessions and cookies.
- API Middlewares
  - Route-level middlewares are defined using `defineMiddlewares`. An example shows how to configure store search with allowed indexes, demonstrating the pattern for adding custom security logic per route.
- Storefront Example Route
  - A minimal GET handler under `/store/custom` illustrates public store endpoint structure.
- Admin Example Route
  - A minimal GET handler under `/admin/custom` illustrates protected admin endpoint structure.
- RBAC Data Model
  - Staff role and permission fields are modeled in the audit module, including role enumeration and boolean flags controlling sensitive operations like COGS visibility, COD confirmation, courier booking, refund processing, content management, and audit log viewing.
- Audit Log Model
  - Audit logs capture actor identity, role, entity type, action, old/new values, IP address, and reason, enabling security auditing and compliance.

**Section sources**
- [medusa-config.ts:7-18](file://apps/medusa/medusa-config.ts#L7-L18)
- [middlewares.ts:1-20](file://apps/medusa/src/api/middlewares.ts#L1-L20)
- [store-custom-route.ts:1-9](file://apps/medusa/src/api/store/custom/route.ts#L1-L9)
- [admin-custom-route.ts:1-9](file://apps/medusa/src/api/admin/custom/route.ts#L1-L9)
- [staff-role-permission.ts:1-17](file://apps/medusa/src/modules/bd-audit/models/staff-role-permission.ts#L1-L17)
- [audit-log.ts:1-43](file://apps/medusa/src/modules/bd-audit/models/audit-log.ts#L1-L43)

## Architecture Overview
The platform separates consumers and security requirements by route namespace:
- `/store/*`: Public storefront API, rate-limited, cart-token based, CORS-restricted to trusted storefront origins.
- `/admin/*`: Protected admin API requiring Bearer JWT and RBAC role checks; additional endpoints may restrict to specific roles (e.g., Owner or Finance).
- `/hooks/*`: Provider webhooks validated via server-to-server signatures or HMAC before processing payloads.

```mermaid
sequenceDiagram
participant Client as "Client"
participant Router as "Medusa Router"
participant MW as "Middleware Layer"
participant Store as "/store/* Handlers"
participant Admin as "/admin/* Handlers"
participant Hooks as "/hooks/* Handlers"
participant DB as "PostgreSQL"
participant Cache as "Redis"
Client->>Router : Request /store/*
Router->>MW : Apply store middlewares
MW-->>Store : Allow if cart token valid
Store->>DB : Read/write cart/order data
Store-->>Client : Response
Client->>Router : Request /admin/*
Router->>MW : Validate Bearer JWT
MW->>Cache : Check session/lockout state
MW->>Admin : Enforce RBAC policy
Admin->>DB : Access protected resources
Admin-->>Client : Response
Client->>Router : Request /hooks/*
Router->>MW : Verify provider signature/HMAC
MW->>Hooks : Process webhook payload
Hooks->>DB : Persist events/logs
Hooks-->>Client : Acknowledge
```

**Diagram sources**
- [architecture.md:305-316](file://docs/architecture.md#L305-L316)
- [technical-plan.md:670-674](file://technical-plan.md#L670-L674)

## Detailed Component Analysis

### JWT Token-Based Authentication
- JWT Secrets and Cookies
  - `jwtSecret` and `cookieSecret` are configured via environment variables in the Medusa configuration file. These secure staff JWT issuance and cookie signing.
- Session Behavior
  - Staff login returns short-lived JWTs stored in HTTP-only cookies. Account lockout and session invalidation are enforced through Redis-backed counters and token revocation strategies.
- First Login Password Change
  - New staff accounts can be provisioned with a flag forcing password change on first login. The admin authentication flow blocks all API access except the password-change endpoint until updated.

```mermaid
flowchart TD
Start(["Staff Login"]) --> Validate["Validate Credentials"]
Validate --> Valid{"Valid?"}
Valid --> |No| LockoutCheck["Check Redis Lockout Counter"]
LockoutCheck --> Increment["Increment Failed Attempts"]
Increment --> MaybeLock["Exceed Threshold?"]
MaybeLock --> |Yes| LockAccount["Lock Account Temporarily"]
MaybeLock --> |No| ReturnError["Return Auth Error"]
Valid --> |Yes| IssueJWT["Issue Short-Lived JWT"]
IssueJWT --> SetCookie["Set HTTP-Only Cookie"]
SetCookie --> CheckForceChange["Check must_change_password Flag"]
CheckForceChange --> ForceChange{"Must Change Password?"}
ForceChange --> |Yes| RedirectChange["Block Other Endpoints Until Password Change"]
ForceChange --> |No| AllowAccess["Allow Normal Admin Access"]
RedirectChange --> End(["End"])
AllowAccess --> End
ReturnError --> End
LockAccount --> End
```

**Diagram sources**
- [medusa-config.ts:7-18](file://apps/medusa/medusa-config.ts#L7-L18)
- [architecture.md:364-382](file://docs/architecture.md#L364-L382)

**Section sources**
- [medusa-config.ts:7-18](file://apps/medusa/medusa-config.ts#L7-L18)
- [architecture.md:364-382](file://docs/architecture.md#L364-L382)

### Cart Token Management
- Guest Customers
  - Guest carts are bound to a secure HTTP-only cookie containing a cart identifier. Requests to `/store/carts/*` and checkout endpoints rely on this token for session continuity.
- Registered Customers
  - Optional phone-based login issues short-lived JWTs in HTTP-only cookies. Subsequent requests carry both cart context and authenticated user context where applicable.
- Order Tracking
  - Customer order tracking authenticates via a combination of Order ID and exact mobile phone number, preventing unauthorized tracking lookups.

```mermaid
sequenceDiagram
participant Browser as "Browser"
participant StoreAPI as "/store/*"
participant CartService as "Cart Service"
participant DB as "PostgreSQL"
Browser->>StoreAPI : GET /store/carts
StoreAPI->>CartService : Resolve cart by cookie cart_id
CartService->>DB : Load cart items and totals
DB-->>CartService : Cart data
CartService-->>StoreAPI : Cart JSON
StoreAPI-->>Browser : Cart response
Browser->>StoreAPI : POST /store/orders (checkout)
StoreAPI->>CartService : Validate cart token and ownership
CartService->>DB : Persist order and clear cart
DB-->>CartService : Order confirmation
CartService-->>StoreAPI : Order result
StoreAPI-->>Browser : Checkout success
```

**Diagram sources**
- [architecture.md:305-316](file://docs/architecture.md#L305-L316)
- [architecture.md:318-334](file://docs/architecture.md#L318-L334)

**Section sources**
- [architecture.md:305-316](file://docs/architecture.md#L305-L316)
- [architecture.md:318-334](file://docs/architecture.md#L318-L334)

### Role-Based Access Control (RBAC)
- Roles and Permissions
  - The audit module defines a `staff_role_permission` model with roles: owner, manager, staff, call_center, warehouse, finance. Boolean flags control access to sensitive features such as COGS visibility, COD confirmation, courier booking, refund processing, content management, and audit log viewing.
- RBAC Enforcement
  - Admin endpoints enforce role checks after JWT validation. Some endpoints restrict access to specific roles (e.g., audit logs viewer restricted to Owner or Finance).
- Audit Trail
  - All auth/security-related actions are recorded in `audit_log`, capturing actor identity, role, entity type, action, and contextual metadata.

```mermaid
classDiagram
class StaffRolePermission {
+string id
+string user_id
+enum role
+boolean can_view_cogs
+boolean can_confirm_cod
+boolean can_book_courier
+boolean can_process_refund
+boolean can_manage_content
+boolean can_view_audit_logs
+boolean must_change_password
}
class AuditLog {
+string id
+string actor_id
+enum actor_role
+string actor_email
+enum entity_type
+string entity_id
+enum action
+json old_value
+json new_value
+string ip_address
+string stated_reason
}
class BdAuditModuleService {
+getPermissions(userId)
+logAction(actor, entity, action, details)
}
BdAuditModuleService --> StaffRolePermission : "reads/writes"
BdAuditModuleService --> AuditLog : "writes"
```

**Diagram sources**
- [staff-role-permission.ts:1-17](file://apps/medusa/src/modules/bd-audit/models/staff-role-permission.ts#L1-L17)
- [audit-log.ts:1-43](file://apps/medusa/src/modules/bd-audit/models/audit-log.ts#L1-L43)
- [bd-audit-service.ts:1-11](file://apps/medusa/src/modules/bd-audit/service.ts#L1-L11)

**Section sources**
- [staff-role-permission.ts:1-17](file://apps/medusa/src/modules/bd-audit/models/staff-role-permission.ts#L1-L17)
- [audit-log.ts:1-43](file://apps/medusa/src/modules/bd-audit/models/audit-log.ts#L1-L43)
- [bd-audit-service.ts:1-11](file://apps/medusa/src/modules/bd-audit/service.ts#L1-L11)
- [architecture.md:384-399](file://docs/architecture.md#L384-L399)

### Middleware Security Patterns
- Route-Level Middlewares
  - The platform uses `defineMiddlewares` to attach middlewares to specific route matchers. An example configures store search with allowed indexes, illustrating how to add custom security logic per route.
- Custom Middleware Creation
  - The API README demonstrates creating a logger middleware and attaching it to a matcher. This pattern applies to authentication, rate limiting, input validation, and audit logging.
- Store Search Security
  - The store search endpoint is secured by configuring allowed indexes, ensuring only permitted search targets are accessible.

```mermaid
flowchart TD
DefineMW["Define Middlewares<br/>defineMiddlewares(routes)"] --> Matcher["matcher: '/store/search'"]
Matcher --> UseMW["middlewares: [configureStoreSearch]"]
UseMW --> AllowedIndexes["allowed_indexes: product=true"]
AllowedIndexes --> NextHandler["Route Handler Executes"]
```

**Diagram sources**
- [middlewares.ts:1-20](file://apps/medusa/src/api/middlewares.ts#L1-L20)
- [api-readme.md:106-136](file://apps/medusa/src/api/README.md#L106-L136)

**Section sources**
- [middlewares.ts:1-20](file://apps/medusa/src/api/middlewares.ts#L1-L20)
- [api-readme.md:106-136](file://apps/medusa/src/api/README.md#L106-L136)

### Route Namespaces and Authentication Levels
- `/store/*`
  - Public storefront API. Requires cart token in cookie for cart mutations. Rate-limited per IP.
- `/admin/*`
  - Protected admin API. Requires Bearer JWT and RBAC role check. Additional endpoints may restrict to specific roles.
- `/hooks/*`
  - External provider webhooks. Require signature or HMAC verification before processing.

```mermaid
flowchart TD
Namespace["Route Namespace"] --> Store["/store/*<br/>Public + Cart Token"]
Namespace --> Admin["/admin/*<br/>Bearer JWT + RBAC"]
Namespace --> Hooks["/hooks/*<br/>Signature/HMAC Verification"]
```

**Diagram sources**
- [architecture.md:305-316](file://docs/architecture.md#L305-L316)

**Section sources**
- [architecture.md:305-316](file://docs/architecture.md#L305-L316)

### Custom Middleware Examples
- Logger Middleware
  - Create a middleware function that logs incoming requests and calls `next()` to continue the pipeline. Attach it to a matcher using `defineMiddlewares`.
- Store Search Middleware
  - Configure store search with allowed indexes to restrict search scope and prevent abuse.

```mermaid
sequenceDiagram
participant Client as "Client"
participant Router as "Medusa Router"
participant LoggerMW as "Logger Middleware"
participant StoreMW as "Store Search Middleware"
participant Handler as "Route Handler"
Client->>Router : POST /store/search
Router->>LoggerMW : Execute logger
LoggerMW->>StoreMW : Continue pipeline
StoreMW->>StoreMW : Validate allowed indexes
StoreMW->>Handler : Invoke handler
Handler-->>Client : Search results
```

**Diagram sources**
- [api-readme.md:106-136](file://apps/medusa/src/api/README.md#L106-L136)
- [middlewares.ts:1-20](file://apps/medusa/src/api/middlewares.ts#L1-L20)

**Section sources**
- [api-readme.md:106-136](file://apps/medusa/src/api/README.md#L106-L136)
- [middlewares.ts:1-20](file://apps/medusa/src/api/middlewares.ts#L1-L20)

### Token Validation Processes
- JWT Validation
  - Admin requests include a Bearer token. The middleware layer validates the token against the configured secret and checks session state in Redis.
- Cart Token Validation
  - Storefront requests validate the cart token from the HTTP-only cookie to ensure cart integrity and ownership.
- Webhook Signature Validation
  - Hook handlers verify provider signatures or HMACs before processing payloads.

```mermaid
flowchart TD
Inbound["Inbound Request"] --> Type{"Request Type"}
Type --> |Admin| ValidateJWT["Validate Bearer JWT"]
Type --> |Store| ValidateCart["Validate Cart Cookie Token"]
Type --> |Hook| ValidateSig["Verify Provider Signature/HMAC"]
ValidateJWT --> RBACCheck["Enforce RBAC Policy"]
ValidateCart --> Proceed["Proceed to Store Handler"]
ValidateSig --> Proceed
RBACCheck --> Proceed
Proceed --> Response["Response"]
```

**Diagram sources**
- [architecture.md:305-316](file://docs/architecture.md#L305-L316)
- [technical-plan.md:670-674](file://technical-plan.md#L670-L674)

**Section sources**
- [architecture.md:305-316](file://docs/architecture.md#L305-L316)
- [technical-plan.md:670-674](file://technical-plan.md#L670-L674)

### Session Management
- JWT Sessions
  - Short-lived JWTs issued upon successful staff login, stored in HTTP-only cookies.
- Account Lockout
  - Redis tracks failed login attempts per email; exceeding threshold locks the account temporarily.
- Session Invalidation
  - Changing password or modifying roles/permissions invalidates active JWT/refresh sessions in Redis.

```mermaid
stateDiagram-v2
[*] --> Unauthenticated
Unauthenticated --> Locked : "Failed Attempts Exceeded"
Unauthenticated --> Authenticated : "Successful Login"
Authenticated --> PasswordChangeRequired : "must_change_password = true"
PasswordChangeRequired --> Authenticated : "Password Updated"
Locked --> Unauthenticated : "Lockout Period Expires"
Authenticated --> [*] : "Logout / Session Invalidated"
```

**Diagram sources**
- [architecture.md:364-382](file://docs/architecture.md#L364-L382)

**Section sources**
- [architecture.md:364-382](file://docs/architecture.md#L364-L382)

### Permission Checking
- RBAC Matrix
  - Features are gated by roles: owner, manager, staff, call_center, warehouse, finance. Sensitive operations like COGS visibility, COD confirmation, courier booking, refund processing, content management, and audit log viewing are controlled by boolean flags.
- Endpoint Restrictions
  - Certain endpoints (e.g., audit logs viewer) are restricted to specific roles such as Owner or Finance.

```mermaid
flowchart TD
Request["Admin Request"] --> HasJWT{"Has Valid JWT?"}
HasJWT --> |No| Deny["Deny Access"]
HasJWT --> |Yes| CheckRole["Load StaffRolePermission"]
CheckRole --> Feature{"Feature Required?"}
Feature --> |COGS View| CanViewCOGS{"can_view_cogs?"}
Feature --> |COD Confirm| CanConfirmCOD{"can_confirm_cod?"}
Feature --> |Courier Book| CanBookCourier{"can_book_courier?"}
Feature --> |Refund Process| CanProcessRefund{"can_process_refund?"}
Feature --> |Content Manage| CanManageContent{"can_manage_content?"}
Feature --> |Audit Logs| CanViewAuditLogs{"can_view_audit_logs?"}
CanViewCOGS --> Allow["Allow"]
CanConfirmCOD --> Allow
CanBookCourier --> Allow
CanProcessRefund --> Allow
CanManageContent --> Allow
CanViewAuditLogs --> Allow
Allow --> End(["End"])
Deny --> End
```

**Diagram sources**
- [staff-role-permission.ts:1-17](file://apps/medusa/src/modules/bd-audit/models/staff-role-permission.ts#L1-L17)
- [architecture.md:384-399](file://docs/architecture.md#L384-L399)

**Section sources**
- [staff-role-permission.ts:1-17](file://apps/medusa/src/modules/bd-audit/models/staff-role-permission.ts#L1-L17)
- [architecture.md:384-399](file://docs/architecture.md#L384-L399)

## Dependency Analysis
Authentication and authorization depend on:
- Medusa configuration for JWT and cookie secrets
- API middlewares for route-level security
- Audit module models and service for RBAC data and auditing
- Architecture documentation defining route namespaces and security boundaries

```mermaid
graph LR
Config["medusa-config.ts"] --> Auth["JWT/Cookie Auth"]
Middlewares["middlewares.ts"] --> Security["Route Security"]
AuditModels["staff-role-permission.ts, audit-log.ts"] --> RBAC["RBAC & Audit"]
Architecture["architecture.md"] --> Boundaries["Route Namespace Policies"]
Auth --> Boundaries
Security --> Boundaries
RBAC --> Boundaries
```

**Diagram sources**
- [medusa-config.ts:7-18](file://apps/medusa/medusa-config.ts#L7-L18)
- [middlewares.ts:1-20](file://apps/medusa/src/api/middlewares.ts#L1-L20)
- [staff-role-permission.ts:1-17](file://apps/medusa/src/modules/bd-audit/models/staff-role-permission.ts#L1-L17)
- [audit-log.ts:1-43](file://apps/medusa/src/modules/bd-audit/models/audit-log.ts#L1-L43)
- [architecture.md:305-316](file://docs/architecture.md#L305-L316)

**Section sources**
- [medusa-config.ts:7-18](file://apps/medusa/medusa-config.ts#L7-L18)
- [middlewares.ts:1-20](file://apps/medusa/src/api/middlewares.ts#L1-L20)
- [staff-role-permission.ts:1-17](file://apps/medusa/src/modules/bd-audit/models/staff-role-permission.ts#L1-L17)
- [audit-log.ts:1-43](file://apps/medusa/src/modules/bd-audit/models/audit-log.ts#L1-L43)
- [architecture.md:305-316](file://docs/architecture.md#L305-L316)

## Performance Considerations
- Rate Limiting
  - Public store endpoints are rate-limited per IP to mitigate abuse and protect checkout endpoints.
- Redis Backing
  - Redis is used for distributed locking, event bus, workflow queues, rate limit buckets, and account lockout counters.
- Input Validation
  - Zod schemas validate inputs across custom endpoints to sanitize and reduce attack surface.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common authentication failures and resolutions:
- Invalid or Expired JWT
  - Ensure `JWT_SECRET` is correctly set and consistent across deployments. Re-authenticate staff users if sessions are invalidated due to password changes or role updates.
- Cart Token Mismatch
  - Verify the HTTP-only cookie contains a valid cart ID. Clear stale cookies if necessary and reinitialize the cart.
- Account Lockout
  - Check Redis lockout counters for the user’s email. Wait for the lockout period to expire or reset counters after verifying legitimate activity.
- RBAC Denials
  - Confirm the staff member’s role and permission flags in `staff_role_permission`. Adjust permissions for the required feature area.
- Webhook Signature Failures
  - Verify provider secrets and HMAC algorithms. Ensure request headers and payloads match expected formats.

**Section sources**
- [architecture.md:364-382](file://docs/architecture.md#L364-L382)
- [technical-plan.md:670-674](file://technical-plan.md#L670-L674)

## Conclusion
The BD Commerce Platform implements robust authentication and authorization through:
- JWT-based staff authentication with strict session controls
- Cart token management for guest and registered customers
- RBAC modeling and enforcement via the audit module
- Middleware patterns for route-level security
- Clear separation of concerns across `/store/*`, `/admin/*`, and `/hooks/*`

Adhering to these patterns ensures secure, scalable, and auditable commerce operations tailored to customer, staff, and external integration needs.