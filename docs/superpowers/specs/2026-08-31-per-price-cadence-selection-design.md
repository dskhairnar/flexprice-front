# Per-price cadence selection at subscription create

Date: 2026-08-31 (revised 2026-09-01)
Status: Frontend shipped; backend follow-up authored separately
Related backend: PR #2699 (mixed-cadence line items + `IsCadenceCompatible`)
Related follow-up backend PR: `include_price_ids` + default flip (see "Backend contract" below)

## Context

Backend PR #2699 lets a subscription hold line items with cadences finer
than the subscription's own. A quarterly subscription can carry monthly
prices; each finer-cadence price fans out into N line items per invoice
(monthly on quarterly → 3 line items per invoice window, each with its
own `period_start` / `period_end`). Compatibility rule (backend
`types.IsCadenceCompatible`, `internal/types/price.go:382`):

- Returns **false** for ONETIME on either side — ONETIME is not on the
  recurring scale.
- Same period AND same count is always compatible.
- Otherwise both must reduce to positive months and
  `subMonths % itemMonths === 0`.
- DAILY / WEEKLY require exact period + count match.

`filterValidPricesForSubscription` handles ONETIME as a separate
always-valid branch *before* invoking `IsCadenceCompatible`; the ONETIME
primitive-level contract is "not on the recurring scale."

Post-#2699 the backend plan-attach filter auto-includes every compatible
price. That surfaced a UX problem: a quarterly sub on a plan with
monthly + quarterly prices silently attaches the monthly, with no way
for the caller to opt subsets in or out per-subscription.

## User-facing goal

Users creating a subscription should:

1. See the plan's exact-cadence charges (+ ONETIME) as the default set.
2. See a separate "Also available on this plan" section listing any
   compatible finer-cadence prices, each with a fan-out hint ("Bills as
   3 line items per subscription invoice"), unchecked by default.
3. Opt in the additional prices they want on this specific subscription.
4. Have the invoice reality match exactly what they selected in the UI.

Requirement (4) requires backend support — see "Backend contract."

## Frontend design

### Helpers (`src/utils/subscription/`)

- `cadenceCompatibility.ts`
  - `billingPeriodMonths(period, count)` — months for month-based
    periods; `null` for DAILY / WEEKLY / ONETIME.
  - `isCadenceCompatible(subPeriod, subCount, itemPeriod, itemCount)`
    — mirrors backend contract exactly, including ONETIME → false on
    either side. Callers that want the "ONETIME always valid" attach
    rule short-circuit before invoking (see `partitionPricesForSubscription`).
  - `cadenceFanoutCount(...)` — cycles per invoice window (1 for
    same-cadence; `null` for ONETIME and other incompatible pairs).

- `planPricesForSubscriptionUi.ts`
  - `partitionPricesForSubscription(prices, subPeriod, subCount, currency)`
    → `{ primary, additional }`.
    - `primary`: exact-cadence prices (same period AND same count) plus
      all ONETIME prices in the sub's currency.
    - `additional`: prices with a strictly finer compatible cadence.
    - Coarser prices (e.g. Annual on a Quarterly sub) are dropped from
      both partitions.
  - `filterPlanPricesForSubscriptionCharges(...)` retained as a legacy
    wrapper returning `primary ∪ additional`; new code should use the
    partition directly.

### State

- `SubscriptionFormState.optedInAdditionalPriceIds: string[]` — plan
  price IDs the user opted in from the "Also available on this plan"
  section. Empty by default (matches backend default of attach-primary).
- Reconciliation: a `useEffect` on the additional-partition membership
  drops IDs that leave the set (e.g. cadence change). Never silently
  re-adds an ID the user removed.

### UI

- `SubscriptionForm.tsx` renders `SubscriptionPriceTable` with
  `pricePartition.primary` as its `data`. All existing behavior
  (overrides, coupons, commitments, added subscription line items,
  quantity edits) applies to the primary table.
- Below the primary table, when `pricePartition.additional.length > 0`,
  a new `AdditionalPlanPricesSection` component renders:
  - Header: "Also available on this plan" (i18n key
    `organisms.additionalPlanPrices.title`).
  - Explainer: "These prices bill more frequently than your
    subscription cadence. Add them to include them on this
    subscription's invoices."
  - Table columns: checkbox / charge (with fan-out hint subtitle) /
    billing period chip / price.
- The existing fan-out hint in `SubscriptionPriceTable` is now a no-op
  in practice (primary is always same-cadence, `fanout === 1`), but is
  retained as a safety net for any future caller that passes non-exact
  prices.

### Submit path

Compute conditionally in `CreateCustomerSubscriptionPage.tsx`:

```ts
if (optedInAdditionalPriceIds.length === 0) {
  // omit include_price_ids — backend applies its default
  //   (attach primary partition: exact cadence + ONETIME)
} else {
  const { primary, additional } = partitionPricesForSubscription(...);
  const validOptedIn = optedInAdditionalPriceIds.filter(id => additionalIds.has(id));
  include_price_ids = [
    ...primary.map(p => p.id),   // explicit primary attach
    ...validOptedIn,              // user opt-ins
  ];
}
```

The `include_price_ids` field on the wire is **authoritative** — the
list *is* the complete set of plan prices to attach — not a delta over
some implicit base. That preserves user's ability later to express
"quarterly sub with no quarterly prices" (send monthly IDs only) or
"attach nothing from the plan" (empty array), without a wire change.

## Backend contract (spec for follow-up backend PR)

### New field on `CreateSubscriptionRequest`

```go
// IncludePriceIDs authoritatively selects which plan prices attach.
//   nil / omitted  -> backend default: attach exact-cadence prices + ONETIME
//   empty slice [] -> attach NO plan prices (extras still come from LineItems)
//   non-empty      -> attach exactly these (intersected server-side with the
//                     compatible-price set); unknown or incompatible id → 400
IncludePriceIDs *[]string `json:"include_price_ids,omitempty" validate:"omitempty,dive,required"`
```

Pointer-slice is required to distinguish `null` from `[]`.

### Filter change in `filterValidPricesForSubscription`

Two modes:

- `includeIDs == nil` — apply the **new default**: attach exact-cadence
  prices (same period AND same count as the sub) plus ONETIME. This is
  a **breaking change vs current develop**: subs on mixed-cadence plans
  will attach fewer prices unless callers add `include_price_ids`.
- `includeIDs != nil` — apply the compat gate as today, then intersect
  with the include set. `[]` → attach none.

### Validation (fail-closed)

- Reject duplicate IDs at DTO layer.
- Every listed ID must exist on the plan AND be `IsCadenceCompatible`
  (ONETIME auto-passes). Otherwise 400 naming the offending IDs.
- Empty slice is legal (not an error).

### Test table (backend repo)

| # | `include_price_ids` | Expected attached plan prices |
|---|---|---|
| 1 | omitted | exact-cadence prices on the plan + ONETIME |
| 2 | `nil` | same as 1 |
| 3 | `[]` | none |
| 4 | one compatible id | exactly that id |
| 5 | subset of compatible ids | exactly those ids, in plan order |
| 6 | ALL compatible ids explicitly | those ids (equal to omitted only if plan has no finer-cadence prices) |
| 7 | contains one incompatible id | 400, error names the id + sub cadence |
| 8 | contains one unknown id | 400, error names the id |
| 9 | mix of compatible + incompatible | 400 (no partial attach) |
| 10 | duplicate ids | 400 at DTO validation |
| 11 | ONETIME id | attached (ONETIME auto-passes cadence check) |
| 12 | `[]` + non-empty `line_items` extras | attaches only extras, no plan prices |

Plus a regression test that `filterValidPricesForSubscription(prices, sub, nil)` on a mixed-cadence plan under a quarterly sub returns *only* the quarterly + ONETIME rows (locks in the new default).

### Extension pattern

Future selection primitives (`include_billing_cadences []BillingPeriod`,
`include_price_tags []string`, etc.) resolve server-side to price IDs
and union with `include_price_ids`. The primitive never breaks.

## Explicit non-goals

- **Grouping fan-out rows on invoice display.** Invoice already renders
  per-line-item `period_start` / `period_end`; three monthly rows just
  render as three rows.
- **Usage display.** `GET /subscriptions/usage` unchanged.
- **Edit-subscription flow.** This spec covers create only. Edit has
  separate endpoints for adding / removing line items.
- **Phase-scoped opt-in.** `SubscriptionPhaseCreateRequest` does not
  get an `include_price_ids` in this iteration. Phases will inherit
  the backend default (exact-cadence + ONETIME) per phase once the
  backend PR lands; a follow-up UI can add per-phase opt-in if needed.
- **Additional-section overrides / coupons / commitments.** Opted-in
  prices attach at their catalog values in this iteration; no override
  or coupon UI on those rows yet.
