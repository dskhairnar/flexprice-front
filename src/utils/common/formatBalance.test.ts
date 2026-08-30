import { describe, it, expect } from 'vitest';
import { formatCredits, formatMoney } from './formatBalance';

describe('formatBalance', () => {
	// The reported defect: a computed credit balance rendered at full float precision.
	it('rounds a full-precision credit balance instead of printing every digit', () => {
		expect(formatCredits(-15029.004249893753)).toBe('-15,029');
	});

	it('keeps genuinely fractional credits', () => {
		expect(formatCredits(10.5)).toBe('10.5');
		expect(formatCredits(0.25)).toBe('0.25');
	});

	it('drops trailing zeros on whole credit amounts', () => {
		expect(formatCredits(200)).toBe('200');
		expect(formatCredits(1000)).toBe('1,000');
	});

	it('always renders money at two decimals', () => {
		expect(formatMoney(-17681.6234)).toBe('-17,681.62');
		expect(formatMoney(100)).toBe('100.00');
		expect(formatMoney(0)).toBe('0.00');
	});

	it('degrades safely on absent or non-numeric input', () => {
		expect(formatCredits(null)).toBe('0');
		expect(formatCredits(undefined)).toBe('0');
		expect(formatMoney(null)).toBe('0.00');
		expect(formatMoney('abc')).toBe('0.00');
	});
});
