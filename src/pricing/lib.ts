// Pricing widget — FEATURE public surface (presentational only).
//
// Aggregated into the published package via `src/exportable/index.ts` (@flexprice/flexprice-ui).
// It exposes ONLY prop-only UI + pure helpers, so the published bundle never drags in the
// dashboard's data layer (axios/auth/router/react-query). "Bring your own data": fetch plans
// however you like, map them to `Plan` (via the exported adapters, or build the shape yourself),
// and render.
//
// The dashboard-facing barrel with the data-connected container lives in `./index.ts` and is
// intentionally NOT re-exported here. Shared styles are imported by the umbrella entry, not here.

// Prop-only UI components — usable individually
export { default as PricingTable } from './components/PricingTable';
export { default as PricingCard, type PricingCardProps, type UsageCharge } from '@/components/molecules/PricingCard/PricingCard';

// Presentational types (public contract, decoupled from backend DTOs)
export type { Plan, Feature, CreditGrantLine, PricingOption, PricingTableProps, PlanType, PlanValidationIssue } from './types';

// Runtime validation boundary — normalize untrusted (SDK/BYO-data) input into safe Plan[].
export { normalizePlans, PlanSchema } from './schema';

// Pure DTO → presentational adapters (optional helpers for consumers mapping Flexprice API data)
export {
	adaptPlanToCard,
	filterAndSortPlans,
	deriveCurrencyPeriodOptions,
	findBestPriceCombination,
	getPriceDisplayType,
	isRecurringPrice,
	isUsageBasedPrice,
	mapCreditGrantToCardProps,
	type PlanWithData,
} from './adapters';
