import { describe, expect, it } from 'vitest';
import { formatPayableAmount, getTotalPayableTextWithCoupons } from './helper_functions';
import { PRICE_TYPE, type Price } from '@/models/Price';

describe('formatPayableAmount', () => {
	it('keeps two decimals for typical amounts', () => {
		expect(formatPayableAmount(10)).toBe('10.00');
		expect(formatPayableAmount(10.5)).toBe('10.50');
		expect(formatPayableAmount(0.01)).toBe('0.01');
	});

	it('preserves sub-cent precision instead of rounding', () => {
		expect(formatPayableAmount(0.0003)).toBe('0.0003');
		// toFixed(2) would incorrectly round this to "0.01"
		expect(formatPayableAmount(0.005)).toBe('0.005');
	});

	it('formats zero as 0.00', () => {
		expect(formatPayableAmount(0)).toBe('0.00');
	});
});

describe('getTotalPayableTextWithCoupons', () => {
	it('shows sub-cent fixed addon charges correctly', () => {
		const fixedCharges = [
			{
				type: PRICE_TYPE.FIXED,
				currency: 'usd',
				amount: '0.0003',
			} as Price,
		];

		expect(getTotalPayableTextWithCoupons(fixedCharges, [], 0.0003, [])).toBe('$0.0003');
	});

	it('does not round 0.005 up to 0.01', () => {
		const fixedCharges = [
			{
				type: PRICE_TYPE.FIXED,
				currency: 'usd',
				amount: '0.005',
			} as Price,
		];

		expect(getTotalPayableTextWithCoupons(fixedCharges, [], 0.005, [])).toBe('$0.005');
	});
});
