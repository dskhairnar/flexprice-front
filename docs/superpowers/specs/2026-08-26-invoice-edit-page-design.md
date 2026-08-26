# Invoice Edit Page — Design

**Date:** 2026-08-26 · **Branch:** `feat/invoice-edit`

## Goal

Give the dashboard an invoice edit page analogous to the existing subscription edit page
(`CustomerSubscriptionEditPage`), so users can change an existing invoice and have the change
persisted by the backend.

## Backend reality (scopes the feature)

The backend (`flexprice` repo, verified on `origin/main`) exposes exactly one general update
endpoint for invoices: `PUT /v1/invoices/{id}` with `UpdateInvoiceRequest`:

| Field | Type | Notes |
|---|---|---|
| `due_date` | ISO datetime | Rejected if in the past — must be sent only when changed |
| `invoice_pdf_url` | string | Must be a valid URL |
| `metadata` | map[string]string | **Full replace**, not a merge |
| `apply_discount` | bool | Recalculates discount from existing coupon associations; **DRAFT invoices only** |

Rules enforced by the service layer:

- Update is allowed only for invoices in **DRAFT or FINALIZED** status; VOIDED and SKIPPED are rejected.
- Line-item add/update/remove is implemented in the EE service layer but **has no HTTP route** —
  the frontend cannot edit line items today. When the backend ships those routes, the page can grow
  an editable line-items section (the service versions edited line items and flips
  `is_manually_edited`, which permanently disables compute).

So the edit page scope is: **due date, invoice PDF URL, metadata, and a draft-only
"reapply coupon discounts" option**, with everything else shown read-only for context.

## Approaches considered

1. **Full edit page (chosen)** — a routed page `${RouteNames.invoices}/:invoiceId/edit`, mirroring
   the subscription edit precedent: read-only context (number, status, customer, line items,
   totals) + an editable details card + single Save building a sparse payload. Discoverable from
   the invoice actions menu everywhere (list, details, customer tab).
2. Drawer/modal on the details page — lighter, but diverges from the subscription-edit precedent
   the user asked to mirror, and leaves no room to grow line-item editing later.
3. Inline editing on the details page — most invasive to a read-oriented page; rejected.

## Design

### Route & entry points

- New route `${RouteNames.invoices}/:invoiceId/edit` → `EditInvoicePage`, with
  `handle: requirePermission('invoice', 'write')` (single global route; the customer-scoped
  details page links to the same URL).
- New "Edit Invoice" option in `InvoiceTableMenu` (the shared invoice actions dropdown), disabled
  when the user lacks `invoice:write` or the invoice is VOIDED/SKIPPED, with a disabled reason.

### Page structure (`src/pages/customer/invoices/EditInvoicePage.tsx`)

- Load via `useQuery({ queryKey: ['invoiceEdit', invoiceId], queryFn: InvoiceApi.getInvoiceById })`
  (direct GET returns full `line_items`).
- Breadcrumb: `updateBreadcrumb(2, invoice_number, detailsUrl)` (segments: billing/invoices/:id/edit).
- **Read-only header card**: invoice number, status + payment status chips, customer (linked),
  currency, issue date, period.
- **Editable details card**: due date (`DateTimePicker`), invoice PDF URL (`Input`), metadata
  key/value rows (same row UI as `MetadataModal`), and — DRAFT only — a `Checkbox`
  "Reapply coupon discounts on save" (`apply_discount`).
- **Read-only line items**: existing `InvoiceLineItemTable` with totals, plus a note that line
  items cannot be edited on an existing invoice (no backend endpoint).
- **Save/Cancel**: Save disabled until something changed; builds a sparse `UpdateInvoicePayload`
  containing only changed fields (`due_date` only when changed, so an unchanged past due date
  never trips backend validation; `metadata` always sent as the full current map when touched).
  On success: toast, `refetchInvoiceQueries()`, invalidate `['invoiceEdit', invoiceId]`, navigate
  back to the invoice details page. On error: `toast.error(error.message || fallback)`.
- Non-editable statuses (VOIDED/SKIPPED): the page renders with inputs disabled, Save hidden, and
  an explanatory banner.

### API / types

- `src/types/dto/InvoiceApi.ts`: new `UpdateInvoicePayload`
  `{ due_date?: string; invoice_pdf_url?: string; metadata?: Record<string, string>; apply_discount?: boolean }`,
  exported from the dto barrel.
- `src/api/InvoiceApi.ts`: retype the existing (previously unused) `updateInvoice` from
  `Partial<Invoice>` to `UpdateInvoicePayload`.

### i18n

New keys under `invoices.edit.*` in `src/i18n/locales/en/billing.json` and the Arabic twin
`src/i18n/locales/ar/billing.json` (both locales are maintained by hand, in parity). The page uses
`useTranslation(['billing', 'common'])` with the standard `t`/`tc` aliases.

### Testing

- `EditInvoicePage.test.tsx` co-located with the page: renders from a mocked invoice, save-button
  enablement on change, sparse-payload construction (due date unchanged ⇒ omitted), status gating.
- `npm run build` + `npx eslint src/` clean.
- Manual verification against the dev server (`.env` from the frontend-testing worktree) on a
  draft invoice.

## Out of scope

- Line-item editing (blocked on backend routes for `AddBulkLineItem` / `UpdateLineItem` /
  `RemoveBulkLineItem`).
- Coupon/tax association management on existing invoices (also unrouted:
  `ApplyCouponRequest` / `ApplyTaxRequest`).
- Payment status & invoice status changes — already covered by existing modals in the actions menu.
