// Runtime validation / normalization boundary for the pricing widget.
//
// WHY: the dashboard feeds trusted, adapter-produced data, but external SDK consumers pass raw
// props from their own code/API. TypeScript disappears at runtime, so a JS consumer — or a TS
// one using `as any` — can hand us the wrong shape. Rather than crash (white screen), we coerce
// what we can, drop what we can't, and surface issues via `onValidationError`.
import { z } from 'zod';
import { PlanType } from '@/constants/planTypes';
import { createNormalizer } from '@/lib/exportable/validation';
import type { Plan } from './types';

const entitlementSchema = z
	.object({
		id: z.coerce.string().catch(''),
		feature_id: z.coerce.string().catch(''),
		name: z.coerce.string().catch(''),
		// Unknown/garbage type falls back to a plain static row instead of breaking the renderer.
		type: z.enum(['STATIC', 'BOOLEAN', 'METERED', 'CONFIG']).catch('STATIC'),
		// Value can be string | number | boolean | object | null — pass through as-is.
		value: z.unknown().nullable().catch(null),
		description: z.coerce.string().optional(),
		usage_reset_period: z.coerce.string().optional(),
	})
	.passthrough();

const priceSchema = z
	.object({
		amount: z.coerce.string().optional(),
		currency: z.coerce.string().optional(),
		billingPeriod: z.coerce.string().optional(),
		type: z.unknown().optional(),
		// The single hard-crash field: an invalid displayType is coerced to a safe default.
		displayType: z.nativeEnum(PlanType).catch(PlanType.FIXED),
	})
	.passthrough();

const creditGrantSchema = z
	.object({
		name: z.coerce.string().catch(''),
		credits: z.coerce.number().catch(0),
		cadence: z.enum(['onetime', 'recurring']).catch('onetime'),
		period: z.coerce.string().nullish(),
	})
	.passthrough();

/**
 * A single plan. `.passthrough()` preserves consumer-supplied callback props (onSelectPlan,
 * getFeatureHref, flags) untouched while the data-bearing fields are validated/coerced.
 * `id` is the only truly required field — without it a plan can't be keyed or selected, so it's
 * dropped rather than repaired.
 */
export const PlanSchema = z
	.object({
		id: z.string().min(1),
		name: z.coerce.string().catch(''),
		description: z.coerce.string().catch(''),
		price: priceSchema.catch({ displayType: PlanType.FIXED }),
		usageCharges: z.array(z.unknown()).catch([]),
		entitlements: z.array(entitlementSchema).catch([]),
		creditGrants: z.array(creditGrantSchema).optional().catch([]),
	})
	.passthrough();

export interface PlanValidationIssue {
	index: number;
	issues: z.ZodIssue[];
}

// Array/single normalization logic lives in the reusable `createNormalizer` primitive
// (`@/lib/exportable/validation`); the pricing-specific schema, issue shape, and default dev-warn
// reporter are supplied here.
const planNormalizer = createNormalizer<Plan>(PlanSchema);

/**
 * Validate + normalize an unknown `plans` input into safe `Plan[]`.
 * - Non-array input → `[]` (reported).
 * - Each entry is coerced where possible; entries without a usable `id` are dropped.
 * - Invalid entries are reported through `onValidationError` (default: `console.warn` in dev).
 */
export function normalizePlans(input: unknown, onValidationError?: (issue: PlanValidationIssue) => void): Plan[] {
	const report =
		onValidationError ??
		((issue: PlanValidationIssue) => {
			if (import.meta.env?.DEV) console.warn('[@flexprice/pricing-ui] invalid plan dropped/normalized:', issue);
		});

	return planNormalizer.normalizeMany(input, report);
}

/**
 * Single-plan variant used by `<PricingCard>` to validate its own props. Unlike the array path,
 * this never drops: a missing `id` is repaired to `''` (a lone card still renders), so a direct
 * SDK consumer of `<PricingCard>` degrades gracefully rather than white-screening. Callback props
 * (onSelectPlan, getFeatureHref, flags) pass through untouched.
 */
export function normalizeCardProps<T extends object>(raw: T): T {
	return planNormalizer.normalizeOne(raw);
}
