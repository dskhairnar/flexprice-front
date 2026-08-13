/**
 * Types for the hand-authored token table in `theme-tokens.mjs`.
 *
 * The table is plain ESM so that Node-side scripts (generate-theme-tokens, verify-theme-tokens) can
 * run it without a build step. This declaration lets the Storybook design-system docs consume the
 * same single source of truth under `strict` TypeScript.
 */

export interface ThemeToken {
	/** Token name without the `--fp-` prefix, e.g. `surface-canvas`. */
	name: string;
	/** Tailwind palette path (`gray.500`, `white`, `black`) or a literal hex. */
	light: string;
	/** Literal hex — the hand-authored Midnight value. */
	dark: string;
	/** Why the token exists / where it is used. Rendered as the swatch caption in the docs. */
	note?: string;
}

export interface ThemeTokenGroup {
	group: string;
	tokens: ThemeToken[];
}

export declare const TOKEN_GROUPS: ThemeTokenGroup[];
export declare const ALL_TOKENS: ThemeToken[];

/** '#6b7280' -> '107 114 128' (space-separated channels, for `rgb(var(--x) / <alpha-value>)`). */
export declare function hexToChannels(hex: string): string;

/** Resolve a light spec ('gray.500' | 'white' | '#3293D9') to a lowercase hex. */
export declare function resolveLight(spec: string, palette: Record<string, Record<string, string>>): string;
