// src/credits/schema.ts
//
// Runtime validation / normalization boundary for the credits widgets.
//
// WHY: containers feed trusted, adapter-produced data, but external SDK consumers pass raw props
// from their own code/API. TypeScript disappears at runtime, so a JS consumer — or a TS one using
// `as any` — can hand us the wrong shape. Rather than crash (white screen), we coerce what we can
// and surface issues via `onValidationError`. Mirrors `src/usage/schema.ts`.
import { z } from 'zod';
import { createNormalizer, type NormalizerIssue } from '@/lib/exportable/validation';
import type { CreditBalanceData, CreditTransaction } from './types';

const nullishToString = z.preprocess((v) => (v == null ? '' : v), z.coerce.string()).catch('');
// Required-with-default variant: null/undefined fall back to 'USD' instead of the empty string.
const nullishToCurrency = z.preprocess((v) => (v == null || v === '' ? 'USD' : v), z.coerce.string()).catch('USD');

// NOTE: unlike `src/usage/schema.ts`, `CreditBalanceData` has no array normalizer —
// `normalizeOne` (see `createNormalizer` in `@/lib/exportable/validation`) takes no `onIssue`
// callback, so there is no `devWarn`-style dev-console reporter for it. A lone `<CreditBalance>`
// repairs invalid input silently rather than dropping it (see `normalizeCreditBalanceData` below).
// `CreditTransaction`, added by Task 2, IS array-normalized (a list of transactions), so it does
// use `devWarn` below, mirroring `src/usage/schema.ts`.

function devWarn(label: string) {
	return (issue: NormalizerIssue) => {
		if (import.meta.env?.DEV) console.warn(`[@flexprice/ui] invalid ${label} dropped/normalized:`, issue);
	};
}

// ── CreditBalance ────────────────────────────────────────────────────────────

export const CreditBalanceDataSchema = z
	.object({
		id: nullishToString,
		name: nullishToString,
		status: z.enum(['active', 'frozen', 'closed']).catch('active'),
		creditBalance: z.coerce.number().catch(0),
		balance: z.coerce.number().catch(0),
		currency: nullishToCurrency,
	})
	.passthrough();

// Single-object normalizer (no array) — a lone `<CreditBalance>` never drops, it repairs.
const creditBalanceNormalizer = createNormalizer<CreditBalanceData>(CreditBalanceDataSchema);

export function normalizeCreditBalanceData<T extends object>(raw: T): CreditBalanceData {
	return creditBalanceNormalizer.normalizeOne(raw) as unknown as CreditBalanceData;
}

// Per this plan's Global Constraints: optional string fields use the nullish-safe preprocessor,
// never bare `z.coerce.string().optional()` (null must become undefined, not the string "null").
const nullishToOptionalString = z.preprocess((v) => (v == null ? undefined : v), z.coerce.string().optional());
const nullishToOptionalNumber = z.preprocess((v) => (v == null ? undefined : v), z.coerce.number().optional());

// ── CreditHistory ────────────────────────────────────────────────────────────

export const CreditTransactionSchema = z
	.object({
		id: nullishToString,
		type: z.enum(['credit', 'debit']).catch('credit'),
		amount: z.coerce.number().catch(0),
		creditAmount: z.coerce.number().catch(0),
		currency: nullishToOptionalString,
		reason: nullishToString,
		createdAt: nullishToString,
		expiryDate: nullishToOptionalString,
		priority: nullishToOptionalNumber,
		transactionStatus: nullishToOptionalString,
	})
	.passthrough();

const creditTransactionNormalizer = createNormalizer<CreditTransaction>(CreditTransactionSchema);

export function normalizeCreditTransactions(input: unknown, onValidationError?: (issue: NormalizerIssue) => void): CreditTransaction[] {
	return creditTransactionNormalizer.normalizeMany(input, onValidationError ?? devWarn('credit transaction'));
}
