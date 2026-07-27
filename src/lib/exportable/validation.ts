// Reusable runtime validation / normalization boundary for exportable component libraries.
//
// WHY: exported components receive raw props from external consumers' own code/API. TypeScript
// disappears at runtime, so a JS consumer — or a TS one using `as any` — can hand us the wrong
// shape. Rather than crash, we coerce what we can, drop what we can't, and surface issues via a
// caller-supplied reporter. `createNormalizer(schema)` packages the array/single normalization
// logic so any component library can reuse it with its own Zod schema and issue reporter.
import type { ZodIssue, ZodType } from 'zod';

/** Generic validation issue: `index` (-1 for whole-input errors) plus the raw Zod issues. */
export interface NormalizerIssue {
	index: number;
	issues: ZodIssue[];
}

/**
 * Build a normalizer bound to `schema`.
 * - `normalizeMany(input, onIssue?)`: non-array input → `[]` (reported at index -1); otherwise each
 *   item is safe-parsed, valid entries collected, invalid entries reported through `onIssue`.
 * - `normalizeOne(raw)`: safe-parse; on failure re-parse a repaired `{ ...raw, id: raw.id ?? '' }`;
 *   returns the repaired data or the original `raw` — never throws.
 */
export function createNormalizer<T>(schema: ZodType): {
	normalizeMany: (input: unknown, onIssue?: (issue: NormalizerIssue) => void) => T[];
	normalizeOne: <R extends object>(raw: R) => R;
} {
	function normalizeMany(input: unknown, onIssue?: (issue: NormalizerIssue) => void): T[] {
		if (!Array.isArray(input)) {
			onIssue?.({ index: -1, issues: [{ code: 'custom', message: '`plans` is not an array', path: [] }] as ZodIssue[] });
			return [];
		}

		const out: T[] = [];
		input.forEach((raw, index) => {
			const result = schema.safeParse(raw);
			if (result.success) {
				out.push(result.data as unknown as T);
			} else {
				onIssue?.({ index, issues: result.error.issues });
			}
		});
		return out;
	}

	function normalizeOne<R extends object>(raw: R): R {
		const result = schema.safeParse(raw);
		if (result.success) return result.data as unknown as R;
		// Even a total parse failure yields a renderable shell (schema fields carry `.catch` defaults);
		// re-parse a repaired object so required fields exist.
		const repaired = schema.safeParse({ ...(raw as object), id: (raw as { id?: unknown }).id ?? '' });
		return (repaired.success ? (repaired.data as unknown as R) : raw) as R;
	}

	return { normalizeMany, normalizeOne };
}
