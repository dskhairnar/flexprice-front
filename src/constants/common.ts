import { formatLocalizedCurrency, formatLocalizedNumber, getLocalizedCurrencySymbol } from '@/i18n/display/formatNumber';
import { getIntlDigitOptions, getIntlLocale } from '@/i18n/display/intlLocale';
import i18n from 'i18next';

// =============================================================================
// COMMON CONSTANTS & UTILITIES
// =============================================================================

// =============================================================================
// CURRENCY FORMATTERS (locale-aware via active i18n language)
// =============================================================================

export const formatCurrency = (amount: number | string, currency: string): string => {
	return formatLocalizedCurrency(amount, currency, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const formatAmount = (amount: number | string, currency?: string): string => {
	if (currency) {
		return formatCurrency(amount, currency);
	}
	return formatLocalizedNumber(amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const getCurrencySymbol = (currency: string): string => {
	return getLocalizedCurrencySymbol(currency);
};

// =============================================================================
// DATE FORMATTERS
// =============================================================================

export const formatDate = (date: string | Date): string => {
	if (!date) return '--';

	const dateObj = typeof date === 'string' ? new Date(date) : date;
	if (isNaN(dateObj.getTime())) return '--';

	const locale = getIntlLocale(i18n.language);
	return new Intl.DateTimeFormat(locale, {
		...getIntlDigitOptions(i18n.language),
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	}).format(dateObj);
};

export const formatDateTime = (date: string | Date): string => {
	if (!date) return '--';

	const dateObj = typeof date === 'string' ? new Date(date) : date;
	if (isNaN(dateObj.getTime())) return '--';

	const locale = getIntlLocale(i18n.language);
	return new Intl.DateTimeFormat(locale, {
		...getIntlDigitOptions(i18n.language),
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
	return `${formatLocalizedNumber(value, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}%`;
};

export { default as formatNumber } from '@/utils/common/format_number';
