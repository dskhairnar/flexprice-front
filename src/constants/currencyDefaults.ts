/** ISO 4217 code when API omits currency (not user-facing copy). */
export const DEFAULT_CURRENCY_CODE = 'USD';

/** Web font that renders the official Saudi Riyal sign (U+20C1); Geist maps it to ¤. */
export const SAUDI_RIYAL_FONT_FAMILY = "'Saudi Riyal Sign'";

/** Official Saudi Riyal sign (Unicode 17.0) and other symbols Intl does not expose consistently. */
export const CURRENCY_SYMBOL_OVERRIDES: Record<string, string> = {
	USD: '$',
	SAR: '\u20c1',
};

export function getCurrencySymbolOverride(currency: string): string | undefined {
	return CURRENCY_SYMBOL_OVERRIDES[currency.toUpperCase()];
}

/** Prepends the SAR web font so U+20C1 renders correctly before the UI font. */
export function withSaudiRiyalFontFamily(fontFamily: string): string {
	return `${SAUDI_RIYAL_FONT_FAMILY}, ${fontFamily}, sans-serif`;
}

export function currencySymbolNeedsDedicatedFont(currency: string): boolean {
	return currency.toUpperCase() === 'SAR';
}
