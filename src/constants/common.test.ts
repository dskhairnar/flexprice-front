import { describe, expect, it } from 'vitest';
import { formatCurrency, getCurrencySymbol } from './common';
import { currencyOptions } from './constants';
import { getCurrencySymbol as getPriceDisplayCurrencySymbol } from '@/utils/common/helper_functions';

describe('currency formatters', () => {
	it('uses the Saudi Riyal symbol for SAR', () => {
		const formattedAmount = formatCurrency(12.34, 'SAR');

		expect(getCurrencySymbol('SAR')).toBe('\u20c1');
		expect(getPriceDisplayCurrencySymbol('SAR')).toBe('\u20c1');
		expect(formattedAmount).toContain('\u20c1');
		expect(formattedAmount).not.toContain('SAR');
	});

	it('uses the Saudi Riyal symbol in currency options', () => {
		expect(currencyOptions.find((currency) => currency.value === 'SAR')?.symbol).toBe('\u20c1');
	});

	it('keeps Intl formatting for currencies without overrides', () => {
		expect(getCurrencySymbol('USD')).toBe('$');
		expect(formatCurrency(12.34, 'USD')).toBe('$12.34');
	});
});
