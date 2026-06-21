# Subscription Tax & Discount (Coupon) Frontend Design

**Date:** 2026-06-22
**Branch:** feat/sub-tax-discount

---

## Overview

This spec covers frontend changes required to reflect backend additions for:
1. New `coupon_code` field on coupons
2. Unified `subscription_coupons` input for subscription creation
3. New mid-cycle modify API types (`coupon`, `tax`) for post-creation add/remove
4. New coupon association model and list API (`GET /coupons/associations`)
5. UI for viewing and managing coupon/tax associations on subscriptions

---

## 1. Data Layer

### 1.1 Model Updates

**`src/models/Coupon.ts`**
- Add `coupon_code?: string` field

**`src/models/CouponAssociation.ts`** — new file
```ts
interface CouponAssociation extends BaseModel {
  coupon_id: string;
  subscription_id: string;
  subscription_line_item_id?: string;
  subscription_phase_id?: string;
  start_date: string;
  end_date?: string;
  coupon?: Coupon;
}
```

**`src/models/Subscription.ts`** — extend existing enums
```ts
enum SUBSCRIPTION_MODIFY_TYPE {
  // existing...
  COUPON = 'coupon',   // new
  TAX = 'tax',         // new
}

enum SUB_MODIFY_COUPON_ACTION {
  ADD = 'add',
  REMOVE = 'remove',
}

enum SUB_MODIFY_TAX_ACTION {
  ADD = 'add',
  REMOVE = 'remove',
}
```

### 1.2 DTO Updates

**`src/types/dto/Coupon.ts`**
- Add `coupon_code?: string` to `CreateCouponRequest`
- `UpdateCouponRequest` unchanged — backend only allows `name` + `metadata`

**`src/types/dto/CouponAssociation.ts`** — new file
```ts
interface CouponAssociationFilter extends Omit<QueryFilter, 'sort'> {
  filters?: TypedBackendFilter[];
  sort?: TypedBackendSort[];
  subscription_ids?: string[];
  coupon_ids?: string[];
  subscription_line_item_ids?: string[];
  subscription_phase_ids?: string[];
  active_only?: boolean;
  period_start?: string;
  period_end?: string;
}

interface ListCouponAssociationsResponse {
  items: CouponAssociation[];
  pagination: Pagination;
}
```

**`src/types/dto/Subscription.ts`** — add to existing file
```ts
// New preferred subscription creation coupon input
interface SubscriptionCouponInput {
  coupon_code: string;        // required
  start_date?: string;
  end_date?: string;
  price_id?: string;          // omit for subscription-level; set for line-item-level
}

// Add to CreateSubscriptionRequest
subscription_coupons?: SubscriptionCouponInput[];  // preferred (new)
// coupons and line_item_coupons remain for backward compat (deprecated)

// New modify params
interface SubModifyCouponParams {
  action: 'add' | 'remove';              // required
  coupon_code?: string;                  // required when action=add
  association_id?: string;               // required when action=remove
  start_date?: string;
  end_date?: string;
  subscription_id?: string;             // mutually exclusive with subscription_line_item_id
  subscription_line_item_id?: string;
}

interface SubModifyTaxParams {
  action: 'add' | 'remove';
  tax_rate_id?: string;                  // required when action=add
  association_id?: string;               // required when action=remove
  effective_date?: string;
}

// Add to ExecuteSubscriptionModifyRequest
coupon_params?: SubModifyCouponParams;
tax_params?: SubModifyTaxParams;
```

### 1.3 API Updates

**`src/api/CouponApi.ts`**
- Add `listCouponAssociations(filter: CouponAssociationFilter): Promise<ListCouponAssociationsResponse>`
- Endpoint: `GET /coupons/associations`

**`src/api/SubscriptionApi.ts`**
- Existing `previewSubscriptionModify` and `executeSubscriptionModify` already accept `ExecuteSubscriptionModifyRequest` — no signature change needed, just the new type values flow through automatically once the DTO is updated.

---

## 2. Coupon UI Changes

### 2.1 CouponDrawer (`src/components/molecules/CouponDrawer/CouponDrawer.tsx`)

- Add `coupon_code` to `CreateCouponRequest` local form state
- Render a new `<Input>` field for "Coupon Code" immediately below the Name field, **create mode only** (`!isEdit`)
- Validation: required on create, error message `"Coupon code is required"`
- No format enforcement (backend is case-insensitive, no special char restrictions)
- `coupon_code` is omitted entirely from the edit form — `UpdateCouponRequest` only accepts `name` + `metadata`
- Update the disabled check on the Save button to also require `coupon_code` when `!isEdit`

### 2.2 CouponDetails (`src/pages/product-catalog/coupons/CouponDetails.tsx`)

- Add a `Coupon Code` entry to the `details` array, positioned second (after the type chip, before Discount)
- Value: if `coupon.coupon_code` exists, render as monospace code badge (`<code className="font-mono bg-muted px-1.5 py-0.5 rounded text-sm">`); otherwise render `'—'`

---

## 3. Subscription Details Page — Read-only Association Tables

**File:** `src/pages/customer/customers/CustomerSubscriptionDetailsPage.tsx`

Two new read-only sections added below the existing charges section:

### 3.1 Coupon Associations Section

**New component:** `src/components/molecules/CouponAssociationTable/CouponAssociationTable.tsx`
- Props: `subscriptionId: string`, `onRemove?: (association: CouponAssociation) => void`
- Handles its own data fetching: `CouponApi.listCouponAssociations({ subscription_ids: [subscriptionId], active_only: false })`
- Shows all associations (active + expired) for full history
- When `onRemove` is provided (edit mode): each row shows a Remove button. When absent (details mode): read-only.

Columns:

| Column | Source | Notes |
|---|---|---|
| Coupon Name | `association.coupon?.name` | Link to `/coupons/:coupon_id` |
| Coupon Code | `association.coupon?.coupon_code` | Monospace badge; `'—'` if null |
| Discount | formatted from coupon type/amount/percentage | e.g. "10%" or "$5.00" |
| Scope | `subscription_line_item_id` present → line item display name; else "Subscription" | |
| Start Date | `formatDate(start_date)` | |
| End Date | `end_date ? formatDate(end_date) : 'Forever'` | |
| Status | Active / Expired chip | `end_date && end_date < now` → Expired |

### 3.2 Tax Associations Section

- Reuse existing `TaxAssociationTable` component
- Wrap with a query: `TaxApi.listTaxAssociations({ entity_type: TAXRATE_ENTITY_TYPE.SUBSCRIPTION, entity_id: subscription_id })`
- Add **Start Date** and **End Date / Forever** columns to the existing table (the `TaxAssociation` model already has these fields)
- No new component needed

---

## 4. Subscription Edit Page — Manage Coupons & Taxes

**File:** `src/pages/customer/customers/CustomerSubscriptionEditPage.tsx`

Two new sections below the existing charges section:
1. **Coupon Associations** — table in edit mode with Add + Remove per row
2. **Tax Associations** — table in edit mode with Add + Remove per row

Each section reuses the same table components from Section 3. The edit page passes an `onRemove` callback to each table, which enables the per-row Remove button and opens the appropriate remove dialog.

### 4.1 ApplyCouponDialog

**File:** `src/components/molecules/ApplyCouponDialog/ApplyCouponDialog.tsx`

**Props:** `subscriptionId: string`, `lineItems: SubscriptionLineItemResponse[]`, `prefilledLineItemId?: string`, `open: boolean`, `onOpenChange: (open: boolean) => void`, `onSuccess: () => void`

**Step 1 — Form:**
- Coupon Code input (required)
- Scope radio: "Subscription level" (default) | "Line item level"
- If "Line item level": select dropdown of `lineItems` (display_name label, `id` as value). The selected line item `id` maps to `subscription_line_item_id` in the payload — **not** `price_id`. When opened from three-dot menu, `prefilledLineItemId` (the line item `id`) pre-fills and locks this field.
- Start Date (optional DatePicker)
- End Date (optional DatePicker; blank = Forever)
- "Preview" button → calls `SubscriptionApi.previewSubscriptionModify({ type: 'coupon', coupon_params: { action: 'add', coupon_code, subscription_line_item_id?, start_date?, end_date? } })`

**Step 2 — Preview panel** (replaces form content in same dialog):
- Shows `changed_resources` from preview response (affected invoices, line items)
- If preview returns no changed resources: show info message "No billing impact"
- "Back" → returns to Step 1
- "Apply" → calls `executeSubscriptionModify` with same payload

**Step 3 — Execute:**
- On success: `toast.success(...)` + `onSuccess()` (caller invalidates query) + close dialog
- On error: `toast.error(error.message)`, stay on Step 2 so user can retry

### 4.2 RemoveCouponDialog

**File:** `src/components/molecules/RemoveCouponDialog/RemoveCouponDialog.tsx`

**Props:** `subscriptionId: string`, `association: CouponAssociation`, `open: boolean`, `onOpenChange`, `onSuccess`

- Confirm step: shows coupon name + code being removed
- "Preview" → `previewSubscriptionModify({ type: 'coupon', coupon_params: { action: 'remove', association_id: association.id } })`
- Shows impact preview, then "Remove" → `executeSubscriptionModify` with same payload
- On success: toast + `onSuccess()`

### 4.3 ApplyTaxDialog

**File:** `src/components/molecules/ApplyTaxDialog/ApplyTaxDialog.tsx`

**Props:** `subscriptionId: string`, `open: boolean`, `onOpenChange`, `onSuccess`

**Step 1 — Form:**
- Tax Rate: searchable select populated from `TaxApi.listTaxRates()` — displays `name (code)`
- Effective Date (optional DatePicker; defaults to now if omitted)
- "Preview" → `previewSubscriptionModify({ type: 'tax', tax_params: { action: 'add', tax_rate_id, effective_date? } })`

**Step 2 — Preview + Execute:** same pattern as `ApplyCouponDialog`.

### 4.4 RemoveTaxDialog

**File:** `src/components/molecules/RemoveTaxDialog/RemoveTaxDialog.tsx`

- Same pattern as `RemoveCouponDialog`
- Payload: `type: 'tax'`, `tax_params: { action: 'remove', association_id }`

### 4.5 Three-dot Menu on Charges Table

**File:** `src/components/molecules/SubscriptionLineItemTable/SubscriptionLineItemTable.tsx` — specifically the `LineItemDropdown` component

Add two new menu items to the existing `DropdownMenu` options per line item, **edit mode only**:
- **"Apply coupon"** → opens `ApplyCouponDialog` with `prefilledLineItemId` set to that line item's id and scope locked to "Line item level"
- **"Remove coupon"** → visible only when a coupon association exists for that line item's id (checked against loaded coupon associations); opens `RemoveCouponDialog` with the matching association

No tax options in the three-dot menu — taxes are subscription-level only.

---

## 5. Query Invalidation Strategy

All four dialogs (apply/remove coupon/tax) call `onSuccess` which triggers the caller to invalidate:
- `['subscriptionEdit', subscriptionId]` — refreshes the edit page core data
- `['couponAssociations', subscriptionId]` — refreshes the coupon table
- `['taxAssociations', subscriptionId]` — refreshes the tax table

---

## 6. Out of Scope

- Updating `subscription_coupons` in the **create** subscription flow (the existing `coupons`/`line_item_coupons` UI continues to work; migration to `subscription_coupons` can be a follow-up)
- Coupon association history / audit log
- Bulk add/remove of coupons or taxes
