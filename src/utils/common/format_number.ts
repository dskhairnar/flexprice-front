import { formatLocalizedCompactNumber, formatLocalizedNumber } from '@/i18n/display/formatNumber';

/**
 * Format a number with locale-aware thousands separators and decimal places.
 */
const formatNumber = (value: number, decimals: number = 0): string => {
	if (!value && value !== 0) return '-';

	const clampedDecimals = Math.max(0, Math.min(20, decimals));

	return formatLocalizedNumber(value, {
		minimumFractionDigits: clampedDecimals,
		maximumFractionDigits: clampedDecimals,
	});
};

/**
 * Format large numbers in compact form for charts and labels (locale-aware).
 */
export const formatCompactNumber = (value: number): string => formatLocalizedCompactNumber(value);

export default formatNumber;
