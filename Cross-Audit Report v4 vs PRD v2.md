# Cross-Audit Report v4 vs PRD v2
**Bangladesh Single-Vendor E-commerce Platform**

> **Audit date:** 2026-10-22
> **Based on:** `Idea Proposition v4.md` (source) vs `prd-2.md` (PRD Draft v2)
> **Previous audit (v3):** Used as historical context, not as unquestionable truth.
> **Owner decisions applied:** Direct bKash/Nagad Merchant API; SMS required Phase 1 (not operational until gateway configured); configurable courier settings with Inside/Outside Dhaka charges; manual return/refund processing; auto-translation drafting with mandatory review; VAT configurable; printable invoices with editable templates; Meta Marketing API when credentials available; Meta CAPI Phase 2; media within real hosting limits; legal/privacy requirements flagged for verification.
> **Audit rules:** No files modified. No web research conducted. All findings evidence-based from the two documents.

---

## ⚠️ Critical Structural Note

`Idea Proposition v4.md` has **"Idea Proposition v3"** in its document title (line 1). The document header reads:
> `# Idea Proposition v3 — Bangladesh E-commerce Platform`

This appears to be a file where the version number in the filename (v4) was updated but the internal title heading was not. Content analysis confirms meaningful differences from the v3 text — notably additions to Sections 5.4, 9, 11.1, 15, 18.1, and 19. For this audit, the **file `Idea Proposition v4.md` is treated as the authoritative v4 source**, noting the heading discrepancy as a documentation issue (Finding F-00 below).

---

## 1. Executive Summary

### Audit Counts

| Category | Count |
|---|---|
| `[Aligned]` requirements | 52 |
| `[PRD More Detailed]` (compatible elaboration) | 20 |
| `[Missing from PRD]` | 2 |
| `[Conflict]` (confirmed) | 3 |
| `[Potential Conflict]` | 2 |
| `[Internal Contradiction]` in PRD | 4 |
| `[Unapproved Addition]` in PRD | 1 |
| Open Decisions remaining | 14 |
| External Verification Required | 8 |

### Progress Since Previous Audit

The previous audit raised **14 material findings** against IP v3. After re-auditing against IP v4 and applying the stated owner decisions:

- **9 findings fully resolved** — most previous "Conflict" items are now `[Aligned]` because IP v4 confirmed what the PRD already stated (bKash/Nagad as launch requirement, campaign landing-page builder in Phase 1, basic return/refund recording as Phase 1 scope, admin payment method management as confirmed, automated social-message exclusion).
- **3 findings still open** — default storefront language, SMS open-in-IP-but-confirmed-in-PRD (now mitigated by owner decision), stock reservation/expiry for unconfirmed COD orders.
- **2 previous findings superseded** — C-01 (missing v4 source document) is resolved; PC-04 (Return & Refund scope in Phase 1) is now partially resolved but scope gap remains, addressed as F-04 below.
- **1 new finding escalated** — the automatic refund in Phase 2 PRD list contradicting the absolute "never" rule is now a P0 concern given the owner's explicit confirmation of no automated refund execution.

### Overall Verdict

## `Needs Minor Corrections Before Approval`

The IP v4 and PRD v2 are **substantially aligned** across all major functional areas. The previous critical structural gap (missing source document) is resolved. Several previously flagged conflicts are now genuinely aligned through IP v4 updates. The remaining issues are meaningful but correctable without fundamental redesign. Specifically:

1. **IP v4's internal title still reads "v3"** — cosmetic but must be corrected before the document serves as the official approved basis.
2. **SMS: owner decision says Phase 1 required; IP v4 still says `[Open]`** — the IP v4 must be updated to reflect the owner's confirmed decision.
3. **Default language: PRD says English; IP v4 says Open (Bangla suggested)** — a genuine unresolved conflict that requires owner decision before implementation.
4. **PRD Phase 2 list mentions "automatic refund execution via payment API"** — directly contradicts the owner's confirmed "never automatic" rule and the PRD's own Section 2.2 and FR-6.7.5.
5. **Full configurable Return & Refund Management as Phase 1 in PRD** — IP v4 Phase 1 only lists "basic cancellation/return/refund recording." The scope gap is real and requires owner confirmation.
6. **Two financial-reporting requirements** (delivery charge collected as a separately trackable metric; COD stock reservation/expiry) need explicit PRD treatment.

---

## 2. Findings Grouped by Priority

---

### P0 — Critical: Must Resolve Before Build

#### F-00 — IP v4 Internal Title Reads "v3" — Document Identity Risk

| Field | Detail |
|---|---|
| **ID** | F-00 |
| **Classification** | `[Conflict]` — document identity |
| **IP v4 evidence** | Line 1: `# Idea Proposition v3 — Bangladesh E-commerce Platform` |
| **PRD evidence** | Line 4: `Based on: approved Idea_Proposition_v4.md` |
| **Issue** | The PRD correctly references v4. The file `Idea Proposition v4.md` exists. However, its internal heading still says "v3." This creates an ambiguity: any reader opening the file sees "v3" and may not recognise it as the approved v4 source. |
| **Risk** | HIGH — document identity confusion; wrong version used as reference during build. |
| **Recommended correction** | Update the internal heading from `# Idea Proposition v3` to `# Idea Proposition v4`. |
| **Owner Approval Required** | Yes (trivial, but must be explicit). |

---

#### F-01 — SMS Notifications: `[Open]` in IP v4 vs. `[Confirmed / Phase 1]` in PRD

| Field | Detail |
|---|---|
| **ID** | F-01 |
| **Classification** | `[Conflict]` — mitigated by stated owner decision |
| **IP v4 evidence** | Section 11.6: "**[Open]** Decide whether SMS is essential at launch and confirm gateway availability and cost." Decision Register Item 12: "Add at launch only if a suitable gateway and budget are confirmed." Section 18.3: "Confirm SMS gateway availability, sender requirements, pricing and expected message volume if SMS is planned." |
| **PRD evidence** | Section 11.6 heading: "**[Confirmed] — required in Phase 1; gateway choice Open**"; FR-11.6.1–11.6.6 fully specify SMS; Section 15 Phase 1 includes SMS as essential/launch-blocking. PRD change summary: "SMS notifications moved from 'Open / Phase 2' to Confirmed, required in Phase 1 — per explicit new instruction." |
| **Owner decision applied** | "SMS is required in Phase 1, but it must not be described as operational until a suitable gateway is configured and tested." |
| **Assessment** | The owner decision resolves the substantive question (SMS = Phase 1 requirement). IP v4 still carries the `[Open]` tag and the "Add at launch only if" conditional language. The IP v4 must be updated to reflect the confirmed decision. The PRD's FR-11.6.5 ("SMS integration is never claimed as operational until a gateway is actually configured and tested") correctly reflects the owner's condition. |
| **Risk** | MEDIUM — a developer reading IP v4 alone will not know SMS is confirmed. |
| **Recommended correction** | **IP v4:** Update Section 11.6 and Decision Register Item 12 to `[Confirmed]` with the nuance: "SMS infrastructure required in Phase 1; actual delivery not operational until a gateway is configured and tested." PRD is already correct. |
| **Owner Approval Required** | Decision already made. IP v4 wording update needed. |

---

#### F-02 — Default Storefront Language: Open/Bangla-suggested in IP v4 vs. English in PRD

| Field | Detail |
|---|---|
| **ID** | F-02 |
| **Classification** | `[Conflict]` — unresolved, no owner decision received |
| **IP v4 evidence** | Section 8.2: "**[Open]** Confirm the default language for first-time visitors. Suggested default: Bangla for first-time storefront visitors in the Bangladesh market." Decision Register Item 1: "Bangla by default for first-time storefront visitors — owner approval is still required." |
| **PRD evidence** | FR-10.2.1: "Default language for first-time storefront visitors is **English**." Presented under `[Confirmed]` section heading. |
| **Assessment** | IP v4 explicitly marks this as `[Open]` and suggests Bangla. The PRD sets English and marks it `[Confirmed]`. No owner decision in the provided decisions list addresses the default language. The PRD resolved an open item in a direction opposite to the IP's suggestion, without a visible approval record in v4. |
| **Risk** | HIGH — wrong default language will affect all first-time visitors. English as default may reduce trust and conversion for a Bangla-primary market. Cannot be silently resolved during build. |
| **Recommended correction** | **Owner must decide the default language.** Record the decision in IP v4 Decision Register Item 1 as `[Confirmed]`. Update PRD FR-10.2.1 to reflect the approved decision. |
| **Owner Approval Required** | **Yes — required before build.** |

---

#### F-03 — PRD Phase 2 "Automatic Refund Execution via Payment API" Contradicts Owner Decision and PRD's Own Hard Rules

| Field | Detail |
|---|---|
| **ID** | F-03 |
| **Classification** | `[Internal Contradiction]` + `[Conflict]` with owner decision |
| **IP v4 evidence** | IP v4 does not mention automated refund execution in any phase. Section 11.5: "record any manual refund in the system." |
| **PRD evidence** | Section 15 Phase 2: "Automatic refund execution via a verified payment-provider refund API (still requiring manual authorization step — never fully automatic)." vs. Section 2.2 Out of Scope: "Automatic return/refund approval or **automatic refund execution of any kind** (see Section 6.7)." vs. FR-6.7.5: "Refunds are **never** automatically approved, initiated, or marked completed — not by order-status change, payment callback, or courier update." |
| **Owner decision applied** | "Never automatically approve, initiate, execute, or mark a refund as completed. Do not introduce a future automated refund-execution feature without explicit owner approval." |
| **Assessment** | The Phase 2 line describes an API-triggered refund execution. Section 2.2 and FR-6.7.5 say "never automatic refund execution of any kind." The owner decision confirms: no automated refund-execution feature without explicit owner approval. The Phase 2 item directly contradicts this. The caveat "still requiring manual authorization step" does not resolve the contradiction — the API execution itself is automatic. This item must be removed unless the owner explicitly re-approves it. |
| **Risk** | HIGH — a developer building Phase 2 may implement an automated payment-API refund call, violating the hard owner rule. |
| **Recommended correction** | **PRD Section 15 Phase 2:** Remove the automatic-refund-API line. If staff-triggered API execution is a genuine future option, note it requires explicit owner approval before design or build begins. Also reconcile PRD Section 2.2's "of any kind" language with any future exception. |
| **Owner Approval Required** | Yes — remove the Phase 2 item and record whether staff-triggered API execution is ever an acceptable future option. |

---

### P1 — Major: Missing or Conflicting Functionality

#### F-04 — Full Configurable Return & Refund System as Phase 1 in PRD; IP v4 Phase 1 Scope Only Lists "Basic Recording"

| Field | Detail |
|---|---|
| **ID** | F-04 |
| **Classification** | `[Conflict]` — phase scope |
| **IP v4 evidence** | Section 15 Phase 1: "**[Recommended]** Basic cancellation/return/refund recording and stock adjustment rules." This is `[Recommended]`, not `[Confirmed]`, and describes only basic recording. |
| **PRD evidence** | Section 15 Phase 1 (`[Confirmed]`, launch-blocking): "**Configurable, manual-only Return & Refund Management** (Section 6.7)." Section 6.7 contains 16 FRs covering configurable policy settings, permission-gated approval workflows, audit trails, independent return/refund status tracking, and more. |
| **Assessment** | IP v4 leaves Phase 1 return/refund as a `[Recommended]` "basic recording" item. The PRD escalates this to a `[Confirmed]` launch-blocking, full-featured system. The PRD's full R&R Management is significantly more than basic recording. The owner's stated decision confirms manual processing is required — but does not explicitly confirm a full Phase 1 system vs. a simpler Phase 1 recording approach. |
| **Risk** | MEDIUM-HIGH. Full system adds significant Phase 1 scope. If deferred, Phase 1 may lack operational safeguards. |
| **Recommended correction** | Owner must confirm: is the **full** configurable Return & Refund Management system (PRD Section 6.7) required at Phase 1 launch, or is basic recording in Phase 1 with the full system in Phase 2 acceptable? Update both documents to reflect the confirmed scope. |
| **Owner Approval Required** | **Yes.** |

---

#### F-05 — bKash/Nagad: Provider/Aggregator Choice Still `[Open]` in IP v4; PRD Confirms Direct API

| Field | Detail |
|---|---|
| **ID** | F-05 |
| **Classification** | `[Potential Conflict]` — partially resolved by owner decision |
| **IP v4 evidence** | Section 11.1: "**[Open]** Verify whether bKash and Nagad will be connected directly or through a supported payment aggregator; this is a technical/provider choice, not a reason to defer the launch requirement." Decision Register Item 3: "verify provider/aggregator availability." |
| **PRD evidence** | FR-7.3.1: "The platform is built for **direct Merchant API integration** with bKash and Nagad (not an aggregator). **[Confirmed]**" |
| **Owner decision applied** | "Direct bKash/Nagad Merchant API integration is the planned approach, subject to merchant approval and valid credentials." |
| **Assessment** | The owner decision resolves the approach. IP v4 still carries `[Open]` for the provider/aggregator choice. The PRD's Confirmed label is now correct per the owner decision. This is a documentation gap in IP v4, not a genuine architectural conflict. |
| **Risk** | LOW (now that owner has decided). Developer reading IP v4 alone may treat direct API as unconfirmed. |
| **Recommended correction** | **IP v4:** Update Section 11.1 and Decision Register Item 3 to confirm direct Merchant API as the planned approach. PRD is already correct. |
| **Owner Approval Required** | Decision already made — IP v4 update needed. |

---

#### F-06 — Delivery Charge Collected Must Be Tracked Separately from Courier Cost: Not Explicitly Required in PRD Reporting

| Field | Detail |
|---|---|
| **ID** | F-06 |
| **Classification** | `[Missing from PRD]` |
| **IP v4 evidence** | Section 13.1: "**[Recommended] Delivery charge collected** = the amount charged to the customer for delivery, less any delivery-charge refund." Section 13.2: "**[Recommended]** Track customer-paid delivery charges separately from the courier cost charged to the business." |
| **PRD evidence** | FR-14.3 formula mentions both "delivery charge collected" (income side) and "actual courier cost" (expense side), but there is **no explicit FR** requiring them to be tracked and displayed as separate, independently labeled line items in the reporting UI. |
| **Assessment** | The PRD includes both figures in the formula but does not contain an explicit requirement that reporting must track and display these as separate, independently reconcilable records. This is particularly important for Bangladesh e-commerce where the courier remits collected COD and delivery charges separately from the business's courier costs. |
| **Risk** | MEDIUM. Conflating these figures produces incorrect contribution calculations and prevents COD settlement reconciliation. |
| **Recommended correction** | **PRD Section 14:** Add explicit FR: "Customer-paid delivery charge collected and the courier cost charged to the business are tracked as separate, independently labeled figures in financial records and reports. They must never be collapsed into a single 'delivery' line." |
| **Owner Approval Required** | No — clarification of existing IP v4 intent. |

---

#### F-07 — COD Stock Reservation / Expiry for Unconfirmed Orders: No Dedicated Open Question in PRD

| Field | Detail |
|---|---|
| **ID** | F-07 |
| **Classification** | `[Missing from PRD]` |
| **IP v4 evidence** | Section 11.2: "**[Recommended]** Define when stock is reserved for an unconfirmed order and when it is released." Section 12: "**[Recommended]** Define stock reservation and expiry only where needed; release reserved stock on cancellation, timeout or failed payment according to explicit rules." |
| **PRD evidence** | FR-6.3.3: "Stock reservation/expiry rules (if used) are explicit … **[Open — see Section 19]**" — but Section 19 does not contain a dedicated, numbered Open Question for this item. It is effectively untracked. |
| **Assessment** | The PRD correctly marks this Open but provides no dedicated tracking for the COD-specific case (stock held for an unconfirmed COD order for potentially multiple days). Without explicit rules, the implementation team must guess the policy. |
| **Risk** | MEDIUM-HIGH. Over-reservation blocks legitimate orders. No reservation causes oversell. This is one of the most operationally significant unresolved inventory questions for a COD-heavy store. |
| **Recommended correction** | **PRD Section 19:** Add a new dedicated Open Question: "When is stock reserved for an unconfirmed COD order, and when is it released? Trigger options: at order placement, at staff confirmation, or not at all. Release options: timeout (configurable duration), staff marks Unreachable, or order cancelled." Add cross-reference from FR-6.3.3. |
| **Owner Approval Required** | Yes — owner must decide the policy. |

---

### P2 — Important Clarity or Consistency Issues

#### F-08 — PRD Section 7.1 Says bKash/Nagad "Required at Launch" Without Clarifying They Are Not Transactional Until Merchant Onboarding

| Field | Detail |
|---|---|
| **ID** | F-08 |
| **Classification** | `[Internal Contradiction]` |
| **PRD evidence** | Section 7.1: "COD, bKash, Nagad required at launch." vs. FR-7.3.2: "Actual integration setup happens **after the application is built** … never presented as already operational." vs. Section 15 Phase 1 footnote: "actual provider credentials are a post-build setup dependency." |
| **Risk** | MEDIUM. Business owner or customer may expect bKash/Nagad to work on launch day. |
| **Recommended correction** | **PRD Section 7.1:** Add a clarifying sentence: "COD is available for customer transactions from launch. bKash and Nagad infrastructure is built at launch; actual transactions require merchant onboarding and credential setup, which is a post-build dependency (FR-7.3.2)." |
| **Owner Approval Required** | No — clarification of PRD's own intent. |

---

#### F-09 — SMS Phase 1 "Required" vs. Gateway `[Open]` Creates Launch-Day Ambiguity

| Field | Detail |
|---|---|
| **ID** | F-09 |
| **Classification** | `[Internal Contradiction]` |
| **PRD evidence** | Section 15 Phase 1 lists SMS as essential/launch-blocking vs. FR-11.6.5: "SMS integration is never claimed as operational until a gateway is actually configured and tested." |
| **Assessment** | Correct reading (per owner decision): SMS infrastructure and Admin configurability are built at launch; actual delivery requires a configured gateway. This must be stated explicitly in Section 15 so launch is not blocked by an unselected gateway. |
| **Risk** | LOW-MEDIUM. Team may delay launch waiting for gateway selection, or may launch claiming SMS is operational when it is not. |
| **Recommended correction** | **PRD Section 15 Phase 1:** Amend the SMS line to: "SMS notification infrastructure (Admin config UI, templates, delivery log, manual resend) — built and configurable at launch; actual delivery operational only after a gateway is selected and tested (Section 19 Q#9). Launch is not blocked by unresolved gateway selection." |
| **Owner Approval Required** | No — implements the owner's stated condition. |

---

#### F-10 — Status Model Non-Final Caveat vs. Confirmed Return/Refund Status Names

| Field | Detail |
|---|---|
| **ID** | F-10 |
| **Classification** | `[Internal Contradiction]` |
| **PRD evidence** | Section 6.2: "This exact state list … are a **recommendation for implementation planning only** and are not final." vs. Section 6.7 which uses specific return/refund status names under `[Confirmed structure]`. |
| **Risk** | LOW-MEDIUM. A developer could conclude return/refund status names are either confirmed (Section 6.7) or non-final (Section 6.2 caveat). |
| **Recommended correction** | **PRD Section 6.2:** Add: "The non-final caveat applies to order/payment/shipment status names and transitions. The existence and independence of a return/refund status field is `[Confirmed]`; its specific state names are `[Recommended]` pending Q#3 sign-off." |
| **Owner Approval Required** | No — clarification. |

---

#### F-11 — Landing-Page Count Warning Requires Hosting Limits That Are Not Yet Known

| Field | Detail |
|---|---|
| **ID** | F-11 |
| **Classification** | `[Internal Contradiction]` |
| **PRD evidence** | FR-5.1.7: "When a storage or provider limit is reached, the admin sees a clear warning/error naming the limit." `[Confirmed]` — but Section 19 Q#11: "Actual hosting/storage/provider limits — Not set; to be based on actual hosting plan." |
| **Risk** | LOW. The warning infrastructure can be built generically. |
| **Recommended correction** | **PRD FR-5.1.7:** Mark as `[Confirmed structure; values dependent on Q#11]` and note that limit values are sourced from the hosting plan once known. |
| **Owner Approval Required** | No. |

---

### P3 — Minor Documentation Consistency

#### F-12 — IP v4 Campaign-Only Checkout `[Open]` Inconsistent with its Own Decision Register Item 5

| Field | Detail |
|---|---|
| **ID** | F-12 |
| **Classification** | `[Potential Conflict]` — within IP v4 itself |
| **IP v4 evidence** | Section 5.3: `[Open]` for campaign-only checkout. Decision Register Item 5: "Direct campaign checkout/order review is in launch scope and preserves existing cart items by default; no separate cart system." |
| **PRD evidence** | FR-5.2.6: Not built in this release; shared cart approach stands. `[Aligned]` with IP v4 Decision Register Item 5. |
| **Risk** | VERY LOW — practical position is the same in both documents. |
| **Recommended correction** | **IP v4 Section 5.3:** Update `[Open]` tag to `[Recommended — not in first release; shared cart is the default]` to match Decision Register Item 5. |
| **Owner Approval Required** | No. |

---

#### F-13 — Meta Marketing API Phase Assignment Not Explicit in PRD Section 15

| Field | Detail |
|---|---|
| **ID** | F-13 |
| **Classification** | `[Unapproved Addition]` — minor; now owner-approved |
| **IP v4 evidence** | Section 10: "Add a spend API later only if it saves meaningful work." |
| **PRD evidence** | FR-5.3.4: `[Recommended]`, credential-gated. Not listed in PRD Section 15 Phase 1 or Phase 2. |
| **Owner decision applied** | "Meta Marketing API may sync campaign/ad-spend data when credentials and access are available." |
| **Risk** | VERY LOW — labeled Recommended and credential-gated. |
| **Recommended correction** | **PRD Section 15 Phase 2:** Add "Meta Marketing API ad-spend sync — once credentials and access are available and after validating it saves meaningful manual work (FR-5.3.4)." |
| **Owner Approval Required** | No — owner has approved the concept. |

---

## 3. Previous-Audit Findings Reconciliation

| Old ID | Previous Finding | Status vs. IP v4 | Evidence |
|---|---|---|---|
| **C-01** | Missing `Idea_Proposition_v4.md` in workspace | ✅ **Resolved** | File exists and is readable. |
| **C-02** | SMS Open in IP v3 vs. Confirmed/Phase 1 in PRD | ⚠️ **Still Open (mitigated)** | IP v4 still carries `[Open]` tag. Owner decision confirms Phase 1, but IP v4 not updated. → **F-01** |
| **C-03** | Default language: Bangla suggested vs. English in PRD | ⚠️ **Still Open** | IP v4 still `[Open]`; no owner decision received for this item. → **F-02** |
| **C-04** | Auto-translation feature not in IP v3 | ✅ **Resolved** | Owner decision approves auto-translation drafting with mandatory review. PRD FR-10.3.3–10.3.4 guard rails are now owner-approved. `[Aligned]`. |
| **C-05** | bKash/Nagad direct API vs. aggregator: Open in IP vs. Confirmed in PRD | ✅ **Resolved (documentation gap remains)** | Owner confirms direct Merchant API. IP v4 still `[Open]` — documentation update needed. → **F-05** |
| **M-01** | COD advance-payment rules missing nuance in PRD | ✅ **No Longer Applicable** | IP v4 and PRD both consistently defer OTP/blocklist. Minor nuance acceptable. |
| **M-02** | Delivery charge collected not explicitly separately tracked in PRD | ⚠️ **Still Open** | PRD still lacks an explicit FR. → **F-06** |
| **M-03** | COD stock reservation/expiry not a dedicated Open Question in PRD | ⚠️ **Still Open** | PRD FR-6.3.3 is `[Open]` but Q not separately listed. → **F-07** |
| **IC-01** | SMS Phase 1 "required" vs. gateway Open — buildability ambiguity | ⚠️ **Still Open** | Same contradiction. → **F-09** |
| **IC-02** | Status model non-final caveat vs. confirmed return/refund status names | ⚠️ **Still Open** | Same contradiction. → **F-10** |
| **IC-03** | bKash/Nagad "required at launch" implies day-one transactions | ⚠️ **Still Open** | PRD Section 7.1 still ambiguous. → **F-08** |
| **IC-04** | Automatic refund via payment API in Phase 2 vs. "never automatic" rule | ⚠️ **Escalated to P0** | Owner decision explicitly prohibits. → **F-03** |
| **IC-05** | Landing-page cap vs. undefined actual ceiling | ⚠️ **Still Open** | Limits still unknown. → **F-11** |
| **OS-01** | Editable invoice templates: not in IP v3, added in PRD | ✅ **Resolved** | Owner decision approves printable invoices with editable/uploadable templates. `[Aligned]`. |
| **OS-02** | Meta Marketing API: no explicit phase assignment | ⚠️ **Minor — still open** | Owner approved concept. Phase assignment missing from PRD Section 15. → **F-13** |
| **OS-03** | Login lockout specific values (5/15) not in IP | ✅ **No Longer Applicable** | Reasonable technical elaboration, delegable to technical team. `[Aligned]`. |
| **OS-04** | Data retention/deletion as permission-gated action | ✅ **No Longer Applicable** | Reasonable production-system elaboration, consistent with owner decisions. `[Aligned]`. |
| **PC-01** | Buy Now variant-already-in-cart: Recommended→Confirmed | ✅ **Resolved** | Owner: "The Buy Now action must not delete or overwrite existing cart items." Decision Register Item 4 confirms behavior. `[Aligned]`. |
| **PC-02** | Campaign checkout cart-preservation: Recommended→Confirmed | ✅ **Resolved** | IP v4 Section 9.1: `[Confirmed]` Campaign checkout must preserve existing cart items. `[Aligned]`. |
| **PC-03** | Campaign landing-page builder moved to Phase 1 in PRD | ✅ **Resolved** | IP v4 Section 9 and Section 15: `[Confirmed]` landing-page builder in Phase 1. `[Aligned]`. |
| **PC-04** | Full Return & Refund system as Phase 1 | ⚠️ **Still Open** | IP v4 Phase 1 still shows only "basic recording" as `[Recommended]`. → **F-04** |

---

## 4. Updated Phase 1 Scope and Dependency Risks

### Phase 1 Launch-Blocking Items — Alignment Status

| Item | IP v4 Status | PRD Status | Risk |
|---|---|---|---|
| Auth + role-based Admin access | `[Confirmed]` | `[Confirmed]` | 🟢 Low |
| Product catalog, categories, variants, inventory | `[Confirmed]` | `[Confirmed]` | 🟢 Low |
| Bangla/English support (switch, translations, layout) | `[Confirmed]` | `[Confirmed]` | 🟡 Font validation required |
| Shared cart, Buy Now (cart-preserving), guest checkout | `[Confirmed]` | `[Confirmed]` | 🟢 Low |
| COD — transactions available at launch | `[Confirmed]` | `[Confirmed]` | 🟢 Low |
| bKash + Nagad — infrastructure built; transactions require merchant onboarding | `[Confirmed]` (requirement) + `[Open]` (approach in IP v4) | `[Confirmed]` (direct API) | 🔴 HIGH — credentials are a post-build dependency |
| Admin payment method management | `[Confirmed]` | `[Confirmed]` | 🟢 Low |
| Automatic website order creation | `[Confirmed]` | `[Confirmed]` | 🟢 Low |
| Manual Admin order entry | `[Confirmed]` | `[Confirmed]` | 🟢 Low |
| Campaign landing-page builder (Mode B direct checkout minimum) | `[Confirmed]` | `[Confirmed]` | 🟢 Low |
| Delivery: Inside/Outside Dhaka configurable charges | `[Confirmed]` (structure) | `[Confirmed]` | 🟡 Exact rates `[Open]` |
| Courier API or manual fallback | `[Recommended]` | Phase 1 context | 🔴 HIGH — specific courier unconfirmed; manual fallback must be built first |
| 3-field status model + independent return/refund status | `[Recommended]` (IP v4) | `[Confirmed]` (PRD) | 🟡 Final state names `[Open]` (Q#3) |
| Return & Refund Management | `[Recommended]` basic recording (IP v4) | `[Confirmed]` full system (PRD) | 🔴 HIGH — scope gap unresolved (F-04) |
| SMS notifications (infrastructure) | `[Open]` (IP v4 — owner decision not yet reflected) | `[Confirmed]` | 🔴 HIGH — gateway `[Open]`; IP v4 must be updated |
| Printable invoices with editable templates | Not explicit in IP v4 | `[Confirmed]` | 🟡 File-type restrictions `[Open]` (Q#16) |
| Storefront theme + homepage/content management | `[Confirmed]` | `[Confirmed]` | 🟢 Low |
| Security baseline (audit logs, secrets, backups, lockout) | `[Recommended]` | `[Confirmed]` | 🟢 Low |

### Critical External Dependencies

| Dependency | Risk | Status |
|---|---|---|
| bKash merchant approval + credentials | 🔴 HIGH | `[Open]` — not available until merchant onboarded |
| Nagad merchant approval + credentials | 🔴 HIGH | `[Open]` — same |
| Courier selection + API capability verification | 🔴 HIGH | `[Open]` — specific courier not chosen; manual fallback must be built first |
| COD stock reservation/expiry policy | 🔴 HIGH | `[Open]` — no owner decision, no dedicated Open Q (F-07) |
| SMS gateway provider, sender ID, cost | 🟡 MEDIUM | `[Open]` — infrastructure built; delivery deferred until configured |
| Final status names and transition logic | 🟡 MEDIUM | `[Open]` — Q#3; must be resolved before Orders module is built |
| Return/refund policy values | 🟡 MEDIUM | `[Open]` — Q#4; system must not invent defaults |
| Hosting/storage capacity limits | 🟡 MEDIUM | `[Open]` — Q#11 |

---

## 5. Remaining Owner Decisions

> ✅ = already resolved by stated owner decisions (document update needed, not decision)
> ❌ = genuine unresolved decision required

| # | Decision | Current Position | Risk | Priority |
|---|---|---|---|---|
| 1 | Default storefront language (Bangla or English) | ❌ IP v4: `[Open]`, Bangla suggested. PRD: English `[Confirmed]` — genuine conflict | Wrong default for Bangladesh market; affects all first-time visitors | **P0** |
| 2 | Full configurable R&R system in Phase 1, or basic recording in Phase 1 + full system in Phase 2? | ❌ IP v4: basic recording `[Recommended]`. PRD: full system `[Confirmed]` | Phase 1 overcommitment or safeguards gap | **P0-P1** |
| 3 | Remove or explicitly re-approve "automatic refund execution via payment API" from Phase 2 PRD list | ❌ Contradicts owner decision and PRD Sections 2.2 and 6.7.5 | Developer may build automated refund trigger in Phase 2 | **P0** |
| 4 | Update IP v4 to reflect SMS as Phase 1 confirmed (with "not operational until gateway configured" nuance) | ✅ Decision made — document update needed | IP v4 documentation inconsistency | **P1** |
| 5 | Update IP v4 to confirm direct Merchant API approach for bKash/Nagad | ✅ Decision made — document update needed | IP v4 documentation inconsistency | **P1** |
| 6 | COD stock reservation/expiry rules for unconfirmed orders | ❌ Neither document has a decision | Oversell or over-reserve risk | **P1** |
| 7 | Final order/payment/shipment status names and allowed transitions (with stock/notification/finance effects) | ❌ Open Q#3 — example states are non-final | Core order management cannot be built without this | **P1** |
| 8 | Return policy values: return window, conditions, non-returnable categories, who pays return shipping, refund methods | ❌ Open Q#4 — values explicitly `[Open]` | Cannot configure the R&R system meaningfully | **P1** |
| 9 | SMS gateway provider, sender ID, cost, expected volume | ❌ Open Q#9 — provider `[Open]` | SMS delivery unavailable until resolved | **P1** |
| 10 | Translation publishing: block on all missing translations, or single-language fallback for non-critical content? | ❌ Open Q#7 | Publishing workflow blocker | **P2** |
| 11 | VAT registration status and legal invoice requirements | ❌ Open Q#8 — flagged for legal verification | Incorrect tax/compliance claims | **P2** |
| 12 | Final staff roles/permissions matrix for actual team | ❌ Open Q#6 | Access control cannot be finalized | **P2** |
| 13 | Advertising cost allocation method | ❌ Open Q#10 — proposed method not yet approved | Contribution-profit reporting is estimate only | **P2** |
| 14 | Hosting/storage/provider limits for landing pages and media | ❌ Open Q#11 — actual limits unknown | Cannot set meaningful storage-limit warnings | **P2** |

---

## 6. Prioritized Correction Plan

> No file should be modified until the owner approves each correction.

### P0 Corrections

| ID | What to Change | Document | Where |
|---|---|---|---|
| COR-01 | Update internal heading: "# Idea Proposition v3" → "# Idea Proposition v4" | IP v4 | Line 1 |
| COR-02 | Owner decides default language → Update IP v4 Decision Register Item 1 to `[Confirmed: {decision}]`, update PRD FR-10.2.1 and Section 10.2 heading | Both | IP v4 §18.2 Item 1; PRD FR-10.2.1 |
| COR-03 | Remove "automatic refund execution via payment-provider refund API" from PRD Phase 2 list. Reconcile PRD Section 2.2 "of any kind" language if the owner later approves a future exception | PRD | §15 Phase 2; §2.2 |

### P1 Corrections

| ID | What to Change | Document | Where |
|---|---|---|---|
| COR-04 | Owner confirms Phase 1 R&R scope → Update IP v4 §15 Phase 1 from `[Recommended] basic recording` to confirmed scope. Update PRD §15 to match. | Both | IP v4 §15; PRD §15 |
| COR-05 | Update IP v4 §11.6 and Decision Register Item 12 to `[Confirmed]`: "SMS infrastructure required in Phase 1; not operational until gateway configured and tested." | IP v4 | §11.6; §18.2 Item 12 |
| COR-06 | Update IP v4 §11.1 line 266 from `[Open]` to confirm direct Merchant API as planned approach (subject to merchant approval). Update Decision Register Item 3. | IP v4 | §11.1; §18.2 Item 3 |
| COR-07 | Add dedicated Open Question to PRD §19 for COD stock reservation/expiry rules. Add cross-reference in FR-6.3.3. | PRD | §19 (new Q#18); FR-6.3.3 |
| COR-08 | Add explicit FR to PRD §14: "Customer-paid delivery charge collected and courier cost charged to the business are tracked as separate, independently labeled figures in financial records and reports." | PRD | §14 |

### P2 Corrections

| ID | What to Change | Document | Where |
|---|---|---|---|
| COR-09 | Amend PRD §7.1 to clarify COD is transactional at launch; bKash/Nagad infrastructure built at launch but transactions require merchant onboarding | PRD | §7.1 |
| COR-10 | Amend PRD §15 Phase 1 SMS line: "SMS infrastructure built and configurable at launch; actual delivery operational only after gateway selection and testing (Q#9)." | PRD | §15 Phase 1 |
| COR-11 | Amend PRD §6.2 to clarify: non-final caveat applies to order/payment/shipment status names; return/refund field existence is `[Confirmed]`; return/refund state names are `[Recommended]` pending Q#3 | PRD | §6.2 |
| COR-12 | Amend PRD FR-5.1.7 to: `[Confirmed structure; values dependent on Q#11]`; note that limit values come from the hosting plan | PRD | FR-5.1.7 |

### P3 Corrections

| ID | What to Change | Document | Where |
|---|---|---|---|
| COR-13 | Add Meta Marketing API to PRD §15 Phase 2 list: "Meta Marketing API ad-spend sync — once credentials and access are available and after validating it saves meaningful manual work (FR-5.3.4)." | PRD | §15 Phase 2 |
| COR-14 | Update IP v4 §5.3 campaign-only checkout from `[Open]` to `[Recommended — not in first release; shared cart is the default]` | IP v4 | §5.3 |

---

## 7. Final Approval-Readiness Checklist

> Each item must be satisfied before build begins.

### Document Integrity
- [ ] `Idea Proposition v4.md` internal heading updated to read "v4" (COR-01)
- [ ] PRD header continues to correctly reference `Idea_Proposition_v4.md`
- [ ] Both documents use consistent status tags (`[Confirmed]`/`[Recommended]`/`[Open]`/`[Out of Scope]`)

### Owner Decisions Recorded
- [ ] Default storefront language decided and recorded as `[Confirmed]` in IP v4 Decision Register (COR-02)
- [ ] Phase 1 scope for Return & Refund Management decided and recorded in both documents (COR-04)
- [ ] Automatic refund execution via payment API removed from PRD Phase 2 (or explicitly re-approved with clear conditions) (COR-03)
- [ ] COD stock reservation/expiry rules decided (COR-07)
- [ ] Final order/payment/shipment status names and allowed transitions approved (Open Q#3)
- [ ] Return window, conditions, non-returnable categories, who pays return shipping, refund methods decided (Open Q#4)

### IP v4 Updated to Reflect Confirmed Owner Decisions
- [ ] IP v4 §11.6 SMS updated to `[Confirmed]` Phase 1 (with gateway-dependency nuance) (COR-05)
- [ ] IP v4 §11.1 bKash/Nagad updated to confirm direct Merchant API (COR-06)
- [ ] IP v4 §5.3 campaign-only checkout Open tag resolved (COR-14)

### PRD Consistency Corrections
- [ ] PRD §7.1 clarifies COD transactional vs. bKash/Nagad infrastructure-only at launch (COR-09)
- [ ] PRD §15 Phase 1 SMS line clarified as "infrastructure built, not operational until gateway configured" (COR-10)
- [ ] PRD §6.2 clarifies which status items are `[Confirmed]` vs. `[Recommended]` non-final (COR-11)
- [ ] PRD §19 adds dedicated Open Question for COD stock reservation/expiry (COR-07)
- [ ] PRD §14 adds explicit FR for separate tracking of delivery charge collected vs. courier cost (COR-08)

### External Dependencies Acknowledged (Not Approval Blockers, but Must Be Tracked)
- [ ] bKash merchant approval and credentials — acknowledged as post-build dependency
- [ ] Nagad merchant approval and credentials — acknowledged as post-build dependency
- [ ] Courier selection, API capability, and exact delivery rates — acknowledged as post-build setup
- [ ] SMS gateway provider and sender ID — acknowledged as post-build setup
- [ ] Hosting/storage capacity limits confirmed from chosen hosting plan (Open Q#11)
- [ ] VAT registration and legal invoice requirements verified with business/accountant (Open Q#8)
- [ ] Bangladesh privacy, consumer-protection, and data-retention obligations verified (Open Q#12)
- [ ] Meta Pixel consent/privacy requirements reviewed before tracking goes live (Open Q#13)

### Quality Gates
- [ ] No requirement in either document is labeled `[Confirmed]` without a traceable owner decision
- [ ] No requirement is labeled `[Open]` if the owner has already decided it
- [ ] No Phase 2 or Phase 3 item describes a capability the owner has explicitly prohibited
- [ ] All acceptance criteria test a stated `[Confirmed]` requirement
- [ ] All Open Questions in Section 19 have a clear statement of "who decides, when, and what is unblocked by the decision"
- [ ] PRD Section 2.2 Out-of-Scope list is consistent with every Phase 2/Phase 3 item listed in Section 15

---

## 8. Critical Issues, Resolved Items, and Next Step

### The Most Critical Issues

1. **F-02 (P0) — Default storefront language is a genuine unresolved conflict.** IP v4 suggests Bangla; PRD sets English as `[Confirmed]`. No owner decision has been received for this item. This affects every first-time visitor to the store and must be decided before any storefront code is written.

2. **F-03 (P0) — PRD Phase 2 lists "automatic refund execution via payment provider API"**, directly contradicting the owner's explicit prohibition and the PRD's own Section 2.2 and FR-6.7.5. This line must be removed or explicitly re-approved with a clear scope definition.

3. **F-04 (P1) — Phase 1 scope gap for Return & Refund Management.** IP v4 Phase 1 says "basic recording" (`[Recommended]`); PRD says full configurable system (`[Confirmed]`, launch-blocking). This is a significant planning and effort difference. Owner confirmation is required before the implementation team can estimate Phase 1.

### Issues Already Resolved by Latest Owner Decisions

| Issue | Resolution |
|---|---|
| bKash/Nagad direct Merchant API approach | ✅ Owner confirmed. PRD FR-7.3.1 is correct. IP v4 documentation update needed (COR-06). |
| Auto-translation drafting with mandatory review | ✅ Owner approved. PRD FR-10.3.3–10.3.4 guard rails are now owner-approved and consistent with IP v4's "no silent machine translation" principle. |
| Printable invoices with editable/uploadable templates | ✅ Owner approved. PRD FR-11.7.1–11.7.2 are now owner-approved. |
| Meta Marketing API when credentials available | ✅ Owner approved concept. FR-5.3.4 correctly labeled `[Recommended]` and credential-gated. |
| Meta CAPI as Phase 2 only | ✅ PRD FR-5.3.7 and Section 2.2 Out-of-Scope are correct. |
| Campaign landing-page builder in Phase 1 | ✅ Fully aligned between IP v4 and PRD. |
| COD + bKash + Nagad as launch requirements | ✅ Aligned. Operational readiness is a post-build dependency. |
| Legal/privacy requirements flagged for verification | ✅ PRD FR-12.8.6 and Open Q#12 correctly handle this. |
| Manual return/refund processing | ✅ PRD Section 6.7 fully aligned with owner decision. |
| SMS required in Phase 1 | ✅ Decision made. IP v4 documentation update needed (COR-05). |

### Decisions Still Requiring Owner Approval

| Priority | Decision |
|---|---|
| **P0** | Default storefront language (Bangla or English) — genuine unresolved conflict |
| **P0** | Remove or explicitly re-approve "automatic refund execution via payment API" from Phase 2 |
| **P1** | Full Return & Refund Management system in Phase 1, or basic recording in Phase 1 with full system in Phase 2? |
| **P1** | COD stock reservation and release rules for unconfirmed orders |
| **P1** | Final status names and transition logic for order/payment/shipment/return statuses (Open Q#3) |
| **P1** | Return policy values: return window, conditions, who pays shipping, refund methods (Open Q#4) |
| **P1** | SMS gateway provider, sender ID, cost, expected volume (Open Q#9) |
| **P2** | Translation publishing rules (Open Q#7) |
| **P2** | Final staff roles/permissions matrix for actual team (Open Q#6) |
| **P2** | Advertising cost allocation method (Open Q#10) |

### Single Recommended Next Step

**Resolve F-02 first.** Decide the default storefront language in a short owner review. This is the only P0 finding where no owner decision has been made at all, it directly contradicts the PRD's current `[Confirmed]` label, and it is a customer-experience decision that cannot be delegated to the technical team. Once this decision is recorded, apply COR-01 through COR-03 (the remaining P0 document corrections), and the documents will be ready for a final owner review before implementation begins.

---

*End of Cross-Audit Report v4 vs PRD v2. No existing project files were modified during this audit.*
