/** ISO 4217 code when API omits currency (not user-facing copy). */
export const DEFAULT_CURRENCY_CODE = 'USD';

/** Web font that renders the official Saudi Riyal sign (U+20C1); Geist maps it to ¤. */
export const SAUDI_RIYAL_FONT_FAMILY = "'Saudi Riyal Sign'";

export const SAUDI_RIYAL_FONT_URL = 'https://cdn.jsdelivr.net/npm/@emran-alhaddad/saudi-riyal-font@1.1.0/fonts/regular/saudi_riyal.woff2';

/** Prepends the SAR web font so U+20C1 renders via unicode-range without replacing the UI font. */
export function withSaudiRiyalFontFamily(fontFamily: string): string {
	if (fontFamily.includes('Saudi Riyal Sign')) return fontFamily;
	return `${SAUDI_RIYAL_FONT_FAMILY}, ${fontFamily}`;
}

/** Official Saudi Riyal sign (Unicode 17.0) and other symbols Intl does not expose consistently. */
export const CURRENCY_SYMBOL_OVERRIDES: Record<string, string> = {
	USD: '$',
	SAR: '\u20c1',
};

export function getCurrencySymbolOverride(currency: string): string | undefined {
	return CURRENCY_SYMBOL_OVERRIDES[currency.toUpperCase()];
}

export function currencySymbolNeedsDedicatedFont(currency: string): boolean {
	return currency.toUpperCase() === 'SAR';
}
