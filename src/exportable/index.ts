// @flexprice/flexprice-ui — THE PUBLISHED PACKAGE ENTRY (umbrella).
//
// `npm i @flexprice/flexprice-ui` gives a consumer every exportable Flexprice UI component from
// one import. Today that's the pricing widget; as more components are made exportable, add one
// line here (e.g. `export * from '@/checkout/lib';`) and its content globs to
// tailwind.flexprice-ui.config.js — nothing else changes.
//
// Each feature owns its own public surface in `src/<feature>/lib.ts` (UI-only, no data layer).
// This file only aggregates them and ships the shared stylesheet.

// Shared theme tokens + the Tailwind utilities every exported component uses (imported once).
import './styles.css';

// ── Pricing widget ───────────────────────────────────────────────────────────
export * from '@/pricing/lib';

// ── Future components (uncomment as they become exportable) ───────────────────
// export * from '@/checkout/lib';
// export * from '@/customer-portal/lib';
// export * from '@/usage/lib';
