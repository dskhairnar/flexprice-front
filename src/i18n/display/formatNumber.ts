import { DEFAULT_CURRENCY_CODE, getCurrencySymbolOverride } from '@/constants/currencyDefaults';
import { getIntlDigitOptions, getIntlLocale } from './intlLocale';

/** Normalize currency code with a non-translatable default when missing. */
export function resolveCurrencyCode(currency?: string | null): string {
	const code = currency?.trim();
	return code ? code.toUpperCase() : DEFAULT_CURRENCY_CODE;
}

export type LocalizedNumberOptions = {
	language?: string;
	minimumFractionDigits?: number;
	maximumFractionDigits?: number;
	notation?: 'standard' | 'compact';
};

/** Parse numeric strings that may include grouping separators from API or inputs. */
export function parseNumericAmount(value: number | string): number | null {
	if (typeof value === 'number') {
		return Number.isFinite(value) ? value : null;
	}
	const trimmed = value.trim();
	if (!trimmed) return null;
	const normalized = trimmed.replace(/,/g, '');
	const num = Number(normalized);
	return Number.isFinite(num) ? num : null;
}

/**
 * Locale-aware number formatting (digits, grouping, decimals) using the active UI language.
 */
export function formatLocalizedNumber(value: number | string, options: LocalizedNumberOptions = {}): string {
	const num = parseNumericAmount(value);
	if (num === null) return '—';

	const locale = getIntlLocale(options.language);
	return new Intl.NumberFormat(locale, {
		...getIntlDigitOptions(options.language),
		minimumFractionDigits: options.minimumFractionDigits,
		maximumFractionDigits: options.maximumFractionDigits ?? 2,
		notation: options.notation ?? 'standard',
	}).format(num);
}

/**
 * Locale-aware currency formatting (symbol position, digits, grouping per locale).
 */
export function formatLocalizedCurrency(amount: number | string, currency: string, options: LocalizedNumberOptions = {}): string {
	const num = parseNumericAmount(amount);
	const currencyCode = resolveCurrencyCode(currency);
	const locale = getIntlLocale(options.language);

	const formatOpts: Intl.NumberFormatOptions = {
		...getIntlDigitOptions(options.language),
		style: 'currency',
		currency: currencyCode,
		minimumFractionDigits: options.minimumFractionDigits,
		maximumFractionDigits: options.maximumFractionDigits ?? 2,
	};

	try {
		const formatter = new Intl.NumberFormat(locale, formatOpts);
		const formatted = formatter.format(num ?? 0);
		const symbolOverride = getCurrencySymbolOverride(currencyCode);
		if (symbolOverride) {
			return formatter
				.formatToParts(num ?? 0)
				.map((part) => (part.type === 'currency' ? symbolOverride : part.value))
				.join('');
		}
		return formatted;
	} catch {
		const symbol = getLocalizedCurrencySymbol(currencyCode, options.language);
		return num === null ? `${symbol}0` : `${symbol}${formatLocalizedNumber(num, options)}`;
	}
}

/** Currency symbol for a code, respecting locale conventions where applicable. */
export function getLocalizedCurrencySymbol(currency: string, language?: string): string {
	const currencyCode = resolveCurrencyCode(currency);
	const override = getCurrencySymbolOverride(currencyCode);
	if (override) return override;
	try {
		return (
			new Intl.NumberFormat(locale, { ...getIntlDigitOptions(language), style: 'currency', currency: currencyCode })
				.formatToParts(0)
				.find((part) => part.type === 'currency')?.value ?? currencyCode
		);
	} catch {
		return currencyCode;
	}
}

/** Compact notation for charts and summaries (e.g. 10K, 1.2M). */
export function formatLocalizedCompactNumber(value: number, language?: string): string {
	if (!Number.isFinite(value)) return '—';
	return new Intl.NumberFormat(getIntlLocale(language), {
		...getIntlDigitOptions(language),
		notation: 'compact',
		maximumFractionDigits: 1,
	}).format(value);
}
