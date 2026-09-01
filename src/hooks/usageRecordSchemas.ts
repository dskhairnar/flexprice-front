// Runtime validation for the usage-syncs data layer's API responses.
//
// The page trusts its own API, but a schema/backend drift shouldn't crash it: a malformed payload
// is dropped (logged in dev) before it reaches the table. The schema stays lenient — only `id`
// (the table's row key) can reject an item; every other field falls back to a safe default so the
// parsed output is a fully-formed `UsageRecord` and no cast is needed downstream. `syncs` entries
// are validated individually because the drawer dereferences them (`entry.skipped` on a null entry
// would throw); an invalid entry is dropped, not the whole record.
import { z } from 'zod';
import { ENTITY_STATUS } from '@/models/base';
import type { UsageRecord, UsageRecordSyncEntry } from '@/models/UsageRecord';

const usageRecordSyncEntrySchema = z
	.object({
		agreement_id: z.string().catch(''),
		reporting_id: z.string().catch(''),
		synced_at: z.string().catch(''),
		skipped: z.boolean().optional(),
		skip_reason: z.string().optional(),
		connection_id: z.string().catch(''),
	})
	.passthrough();

const validatedSyncs = z
	.record(z.unknown())
	.catch({})
	.transform((raw): Record<string, UsageRecordSyncEntry> => {
		const out: Record<string, UsageRecordSyncEntry> = {};
		for (const [provider, entry] of Object.entries(raw ?? {})) {
			const result = usageRecordSyncEntrySchema.safeParse(entry);
			if (result.success) out[provider] = result.data;
			else if (import.meta.env?.DEV) console.warn('[%s] dropped invalid sync entry', 'usageRecords', provider, result.error.issues);
		}
		return out;
	});

export const usageRecordItemSchema = z
	.object({
		id: z.string().min(1),
		customer_id: z.string().catch(''),
		customer_external_id: z.string().catch(''),
		subscription_id: z.string().catch(''),
		plan_id: z.string().catch(''),
		quantity: z.string().catch(''),
		amount: z.string().catch(''),
		currency: z.string().catch(''),
		period_start: z.string().catch(''),
		period_end: z.string().catch(''),
		synced: z.boolean().catch(false),
		syncs: validatedSyncs,
		// BaseModel fields the page doesn't dereference — defaulted so the parsed
		// item satisfies UsageRecord without an assertion.
		created_at: z.string().catch(''),
		updated_at: z.string().catch(''),
		created_by: z.string().catch(''),
		updated_by: z.string().catch(''),
		tenant_id: z.string().catch(''),
		environment_id: z.string().catch(''),
		status: z.nativeEnum(ENTITY_STATUS).catch(ENTITY_STATUS.PUBLISHED),
	})
	.passthrough();

// Compile-time proof that a validated item is a real UsageRecord.
export type ValidatedUsageRecord = z.infer<typeof usageRecordItemSchema> & UsageRecord;

/**
 * Validate a paginated `{ items: [...] }` response, returning only the items that pass `itemSchema`.
 * Non-array payloads yield `[]`; individual invalid items are dropped (both logged in dev).
 */
export function validateResponseItems<T>(itemSchema: z.ZodType<T, z.ZodTypeDef, unknown>, raw: unknown, label: string): T[] {
	const envelope = z
		.object({ items: z.array(z.unknown()) })
		.passthrough()
		.safeParse(raw);
	if (!envelope.success) {
		// Keep the format string constant and pass `label` as a substitution value - interpolating
		// it directly would let a stray %-specifier in a future dynamic label forge the logged output.
		if (import.meta.env?.DEV) console.warn('[%s] response is not a paginated { items: [] } shape', label, envelope.error.issues);
		return [];
	}
	const out: T[] = [];
	for (const item of envelope.data.items) {
		const result = itemSchema.safeParse(item);
		if (result.success) out.push(result.data);
		else if (import.meta.env?.DEV) console.warn('[%s] dropped invalid item', label, result.error.issues);
	}
	return out;
}
