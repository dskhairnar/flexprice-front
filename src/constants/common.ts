import { formatLocalizedCurrency, formatLocalizedNumber, getLocalizedCurrencySymbol } from '@/i18n/display/formatNumber';

// =============================================================================
// COMMON CONSTANTS & UTILITIES
// =============================================================================

// =============================================================================
// CURRENCY FORMATTERS (locale-aware via active i18n language)
// =============================================================================

export const formatCurrency = (amount: number | string, currency: string): string =>
	formatLocalizedCurrency(amount, currency, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatAmount = (amount: number | string, currency?: string): string => {
	if (currency) {
		return formatCurrency(amount, currency);
	}
	return formatLocalizedNumber(amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const getCurrencySymbol = (currency: string): string => getLocalizedCurrencySymbol(currency);

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
