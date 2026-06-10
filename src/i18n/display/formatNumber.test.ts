import { describe, expect, it } from 'vitest';
import { formatLocalizedCurrency, getLocalizedCurrencySymbol } from './formatNumber';

const SAR = '\u20c1';

describe('SAR currency formatting', () => {
	it('uses the official Saudi Riyal sign as the symbol', () => {
		expect(getLocalizedCurrencySymbol('SAR')).toBe(SAR);
		expect(getLocalizedCurrencySymbol('SAR', 'en')).toBe(SAR);
		expect(getLocalizedCurrencySymbol('SAR', 'ar')).toBe(SAR);
	});

	it('formats SAR in English with the riyal sign instead of the ISO code', () => {
		const formatted = formatLocalizedCurrency(12.34, 'SAR', { language: 'en' });

		expect(formatted).toContain(SAR);
		expect(formatted).not.toContain('SAR');
		expect(formatted).toContain('12.34');
	});

	it('formats SAR in Arabic with localized digits and symbol placement', () => {
		const formatted = formatLocalizedCurrency(12.34, 'SAR', { language: 'ar' });

		expect(formatted).toContain(SAR);
		expect(formatted).not.toContain('SAR');
		expect(formatted).not.toMatch(/^SAR/);
		expect(formatted).toContain('١٢');
	});
});
