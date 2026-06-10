import { formatLocalizedNumber } from '@/i18n/display/formatNumber';

// =============================================================================
// COMMON CONSTANTS & UTILITIES
// =============================================================================

// =============================================================================
// CURRENCY FORMATTERS (locale-aware via active i18n language)
// =============================================================================

const CURRENCY_SYMBOL_OVERRIDES: Record<string, string> = {
	SAR: '\u20c1',
};

const getCurrencySymbolOverride = (currency: string): string | undefined => CURRENCY_SYMBOL_OVERRIDES[currency.toUpperCase()];

export const formatCurrency = (amount: number | string, currency: string): string => {
	const formatted = formatLocalizedCurrency(amount, currency, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	const symbolOverride = getCurrencySymbolOverride(currency);
	if (!symbolOverride) return formatted;

	const defaultSymbol = getLocalizedCurrencySymbol(currency);
	return formatted.replace(defaultSymbol, symbolOverride);
};

export const formatAmount = (amount: number | string, currency?: string): string => {
	if (currency) {
		return formatCurrency(amount, currency);
	}
	return formatLocalizedNumber(amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const getCurrencySymbol = (currency: string): string => {
	const symbolOverride = getCurrencySymbolOverride(currency);
	if (symbolOverride) return symbolOverride;
	return getLocalizedCurrencySymbol(currency);
};

// =============================================================================
// DATE FORMATTERS
// =============================================================================

export const formatDate = (date: string | Date): string => {
	if (!date) return '--';

	const dateObj = typeof date === 'string' ? new Date(date) : date;
	if (isNaN(dateObj.getTime())) return '--';

	return new Intl.DateTimeFormat('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	}).format(dateObj);
};

export const formatDateTime = (date: string | Date): string => {
	if (!date) return '--';

	const dateObj = typeof date === 'string' ? new Date(date) : date;
	if (isNaN(dateObj.getTime())) return '--';

	return new Intl.DateTimeFormat('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	}).format(dateObj);
};

// =============================================================================
// UTILITY FORMATTERS
// =============================================================================

export const toSentenceCase = (str: string): string => {
	if (!str) return '';
	return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
	return `${value.toFixed(decimals)}%`;
};

export { default as formatNumber } from '@/utils/common/format_number';
