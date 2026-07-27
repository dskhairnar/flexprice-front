// Public presentational types for the pricing widget.
//
// These are intentionally decoupled from backend DTOs (PlanResponse / PriceResponse / …).
// The container maps API responses INTO these shapes via `adapters.ts`, so backend schema
// changes never leak into the widget's public contract.

import type { PricingCardProps, UsageCharge } from '@/components/molecules/PricingCard/PricingCard';
import type { PlanType } from '@/constants/planTypes';
import type { PlanValidationIssue } from './schema';

/** A single, fully-presentational plan the widget renders. Alias of the card's prop shape. */
export type Plan = PricingCardProps;

/** An entitlement (feature) line as rendered by the widget. */
export type Feature = PricingCardProps['entitlements'][number];

/** A per-plan credit grant line. */
export type CreditGrantLine = NonNullable<PricingCardProps['creditGrants']>[number];

export type { UsageCharge };
export type { PlanType };

/** A `{ label, value }` option for the currency / billing-period selectors. */
export interface PricingOption {
	label: string;
	value: string;
}

/** Props for the prop-only `<PricingTable />` — no fetching, no auth, no routing. */
export interface PricingTableProps {
	/** Plans to render, already filtered to the active currency + billing period. */
	plans: Plan[];

	/** Controlled billing-period selection. */
	billingPeriod: string;
	onBillingPeriodChange: (value: string) => void;
	billingPeriodOptions: PricingOption[];
	/** Placeholder for the billing-period selector (pass a translated string). */
	billingPeriodPlaceholder?: string;

	/** Controlled currency selection. */
	currency: string;
	onCurrencyChange: (value: string) => void;
	currencyOptions: PricingOption[];
	/** Placeholder for the currency selector (pass a translated string). */
	currencyPlaceholder?: string;

	/** Invoked when a plan's CTA is clicked. Consumers wire their own navigation/checkout. */
	onSelectPlan?: (planId: string) => void;

	/** Optional link target for a feature name; return undefined for plain text (default). */
	getFeatureHref?: (featureId: string) => string | undefined;

	/** Hide the currency / billing-period selectors (e.g. single-currency embeds). */
	hideFilters?: boolean;

	/**
	 * Called for each `plans` entry that failed runtime validation (dropped) or was coerced.
	 * Use it to log/report bad SDK input. Defaults to a dev-only `console.warn`.
	 */
	onValidationError?: (issue: PlanValidationIssue) => void;

	className?: string;
}

export type { PlanValidationIssue } from './schema';
