// Runtime validation for the pricing data-layer API responses.
//
// The dashboard trusts its own API, but a schema/backend drift shouldn't crash the pricing page:
// malformed payloads are dropped (logged in dev) before they reach the adapters. Schemas are
// intentionally lenient — `.passthrough()` keeps every real field, and only the values the
// adapters dereference *unconditionally* are required (so we prevent the known crash vectors
// without discarding valid, partially-populated rows).
import { z } from 'zod';

/** Plans are keyed/merged by `id`; a plan without one can't be rendered. */
export const planItemSchema = z.object({ id: z.string().min(1) }).passthrough();

/** Adapters call `price.currency.toUpperCase()`, so currency must be a string. */
export const priceItemSchema = z.object({ currency: z.string() }).passthrough();

/** Entitlements/grants are only read via optional access — just reject non-objects. */
export const entitlementItemSchema = z.object({}).passthrough();
export const creditGrantItemSchema = z.object({}).passthrough();

/**
 * Validate a paginated `{ items: [...] }` response, returning only the items that pass `itemSchema`.
 * Non-array payloads yield `[]`; individual invalid items are dropped (both logged in dev).
 */
export function validateResponseItems<T>(itemSchema: z.ZodType<T>, raw: unknown, label: string): T[] {
	const envelope = z
		.object({ items: z.array(z.unknown()) })
		.passthrough()
		.safeParse(raw);
	if (!envelope.success) {
		if (import.meta.env?.DEV) console.warn(`[pricing] ${label}: response is not a paginated { items: [] } shape`, envelope.error.issues);
		return [];
	}
	const out: T[] = [];
	for (const item of envelope.data.items) {
		const result = itemSchema.safeParse(item);
		if (result.success) out.push(result.data);
		else if (import.meta.env?.DEV) console.warn(`[pricing] ${label}: dropped invalid item`, result.error.issues);
	}
	return out;
}
