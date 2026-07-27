// @flexprice/pricing-ui — public surface for the embeddable pricing widget.
//
// This is the single entry consumers (and, for now, the dashboard) import from. It exposes:
//   • prop-only UI (PricingTable, PricingCard) — bring your own data,
//   • a data-connected container (PricingContainer) for the dashboard / API-backed use,
//   • presentational types and the pure DTO→Plan adapters.
//
// Roadmap: when this moves to `packages/pricing-ui`, this file is the package entry — the
// import paths change (`@/…` → relative), nothing else.

// Prop-only UI (no fetching / auth / routing)
export { default as PricingTable } from './components/PricingTable';
export { default as PricingCard, type PricingCardProps, type UsageCharge } from '@/components/molecules/PricingCard/PricingCard';

// Data-connected container (dashboard / API-backed)
export { default as PricingContainer, type PricingContainerProps, type PricingContainerView } from './containers/PricingContainer';

// Data hook (swap-point for an injected client when published externally)
export { usePricingData, type UsePricingDataArgs, type UsePricingDataResult } from './hooks/usePricingData';

// Presentational types
export type { Plan, Feature, CreditGrantLine, PricingOption, PricingTableProps, PlanType } from './types';

// Pure DTO → presentational adapters
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
