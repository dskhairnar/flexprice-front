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

// `z.coerce.string()` turns `undefined`/`null` into the literal `"undefined"`/`"null"` (and its
// `.catch('')` never fires because coercion "succeeds"). Preprocess nullish → '' first so missing
// fields normalize to an empty string.
const nullishToString = z.preprocess((v) => (v == null ? '' : v), z.coerce.string()).catch('');

const entitlementSchema = z
	.object({
		id: nullishToString,
		feature_id: nullishToString,
		name: nullishToString,
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
		name: nullishToString,
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
		name: nullishToString,
		description: nullishToString,
		// Functional catches so every normalized plan gets its OWN fallback object/array — a shared
		// mutable literal could be aliased across plans (and mutated by a consumer).
		price: priceSchema.catch(() => ({ displayType: PlanType.FIXED })),
		usageCharges: z.array(z.unknown()).catch(() => []),
		entitlements: z.array(entitlementSchema).catch(() => []),
		creditGrants: z
			.array(creditGrantSchema)
			.optional()
			.catch(() => []),
	})
	.passthrough();

/**
 * Card variant of {@link PlanSchema} for the single-plan path. `normalizeCardProps` repairs a
 * missing `id` to `''` so a lone `<PricingCard>` still renders — but `PlanSchema.id` is `min(1)`
 * and would reject `''`. This schema relaxes only `id` (defaulting to `''`) so the repaired parse
 * succeeds; the array path keeps the strict `PlanSchema` and still drops id-less plans.
 */
export const CardPlanSchema = PlanSchema.extend({ id: nullishToString });

export interface PlanValidationIssue {
	index: number;
	issues: z.ZodIssue[];
}

// Array/single normalization logic lives in the reusable `createNormalizer` primitive
// (`@/lib/exportable/validation`); the pricing-specific schema, issue shape, and default dev-warn
// reporter are supplied here.
const planNormalizer = createNormalizer<Plan>(PlanSchema);
// Card path uses the id-relaxed schema so the missing-id repair (`''`) parses successfully.
const cardNormalizer = createNormalizer<Plan>(CardPlanSchema);

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
			if (import.meta.env?.DEV) console.warn('[@flexprice/ui] invalid plan dropped/normalized:', issue);
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
	return cardNormalizer.normalizeOne(raw);
}
