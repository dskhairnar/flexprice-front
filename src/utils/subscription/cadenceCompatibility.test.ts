import { describe, expect, it } from 'vitest';
import { BILLING_PERIOD } from '@/constants/constants';
import { billingPeriodMonths, cadenceFanoutCount, isCadenceCompatible } from './cadenceCompatibility';

describe('billingPeriodMonths', () => {
	it('converts month-based periods to effective months', () => {
		expect(billingPeriodMonths(BILLING_PERIOD.MONTHLY, 1)).toBe(1);
		expect(billingPeriodMonths(BILLING_PERIOD.MONTHLY, 2)).toBe(2);
		expect(billingPeriodMonths(BILLING_PERIOD.QUARTERLY, 1)).toBe(3);
		expect(billingPeriodMonths(BILLING_PERIOD.HALF_YEARLY, 1)).toBe(6);
		expect(billingPeriodMonths(BILLING_PERIOD.ANNUAL, 1)).toBe(12);
		expect(billingPeriodMonths(BILLING_PERIOD.ANNUAL, 2)).toBe(24);
	});

	it('returns null for daily / weekly / onetime', () => {
		expect(billingPeriodMonths(BILLING_PERIOD.DAILY, 1)).toBeNull();
		expect(billingPeriodMonths(BILLING_PERIOD.WEEKLY, 1)).toBeNull();
		expect(billingPeriodMonths(BILLING_PERIOD.ONETIME, 1)).toBeNull();
	});

	it('treats missing / zero count as 1', () => {
		expect(billingPeriodMonths(BILLING_PERIOD.MONTHLY)).toBe(1);
		expect(billingPeriodMonths(BILLING_PERIOD.MONTHLY, 0)).toBe(1);
	});

	it('accepts lower-case string periods (defensive)', () => {
		expect(billingPeriodMonths('monthly', 1)).toBe(1);
	});
});

describe('isCadenceCompatible', () => {
	it('ONETIME on either side is NOT compatible on the recurring scale (matches backend contract)', () => {
		// Callers that want the "ONETIME is always valid" attach rule must special-case it
		// before invoking — see partitionPricesForSubscription / backend filterValidPricesForSubscription.
		expect(isCadenceCompatible(BILLING_PERIOD.QUARTERLY, 1, BILLING_PERIOD.ONETIME, 1)).toBe(false);
		expect(isCadenceCompatible(BILLING_PERIOD.MONTHLY, 1, BILLING_PERIOD.ONETIME, 1)).toBe(false);
		expect(isCadenceCompatible(BILLING_PERIOD.DAILY, 1, BILLING_PERIOD.ONETIME, 1)).toBe(false);
		expect(isCadenceCompatible(BILLING_PERIOD.ONETIME, 1, BILLING_PERIOD.MONTHLY, 1)).toBe(false);
	});

	it('same-cadence pairs are compatible', () => {
		expect(isCadenceCompatible(BILLING_PERIOD.MONTHLY, 1, BILLING_PERIOD.MONTHLY, 1)).toBe(true);
		expect(isCadenceCompatible(BILLING_PERIOD.QUARTERLY, 1, BILLING_PERIOD.QUARTERLY, 1)).toBe(true);
		expect(isCadenceCompatible(BILLING_PERIOD.DAILY, 1, BILLING_PERIOD.DAILY, 1)).toBe(true);
	});

	it('monthly item divides quarterly / half-yearly / annual sub', () => {
		expect(isCadenceCompatible(BILLING_PERIOD.QUARTERLY, 1, BILLING_PERIOD.MONTHLY, 1)).toBe(true);
		expect(isCadenceCompatible(BILLING_PERIOD.HALF_YEARLY, 1, BILLING_PERIOD.MONTHLY, 1)).toBe(true);
		expect(isCadenceCompatible(BILLING_PERIOD.ANNUAL, 1, BILLING_PERIOD.MONTHLY, 1)).toBe(true);
	});

	it('quarterly item divides half-yearly and annual sub', () => {
		expect(isCadenceCompatible(BILLING_PERIOD.HALF_YEARLY, 1, BILLING_PERIOD.QUARTERLY, 1)).toBe(true);
		expect(isCadenceCompatible(BILLING_PERIOD.ANNUAL, 1, BILLING_PERIOD.QUARTERLY, 1)).toBe(true);
	});

	it('half-yearly item divides annual sub', () => {
		expect(isCadenceCompatible(BILLING_PERIOD.ANNUAL, 1, BILLING_PERIOD.HALF_YEARLY, 1)).toBe(true);
	});

	it('coarser item is NOT compatible with finer sub', () => {
		expect(isCadenceCompatible(BILLING_PERIOD.MONTHLY, 1, BILLING_PERIOD.QUARTERLY, 1)).toBe(false);
		expect(isCadenceCompatible(BILLING_PERIOD.QUARTERLY, 1, BILLING_PERIOD.ANNUAL, 1)).toBe(false);
	});

	it('annual item is NOT compatible with quarterly sub (12 % 3 == 0 but item > sub)', () => {
		// 3 % 12 !== 0 — sub is finer than item.
		expect(isCadenceCompatible(BILLING_PERIOD.QUARTERLY, 1, BILLING_PERIOD.ANNUAL, 1)).toBe(false);
	});

	it('quarterly item on annual sub with count > 1: item_count respected', () => {
		// annual*1 = 12 months, quarterly*2 = 6 months → 12 % 6 === 0 → compatible
		expect(isCadenceCompatible(BILLING_PERIOD.ANNUAL, 1, BILLING_PERIOD.QUARTERLY, 2)).toBe(true);
		// annual*1 = 12 months, quarterly*5 = 15 months → 12 % 15 !== 0 → not compatible
		expect(isCadenceCompatible(BILLING_PERIOD.ANNUAL, 1, BILLING_PERIOD.QUARTERLY, 5)).toBe(false);
	});

	it('DAILY / WEEKLY require exact match with same count', () => {
		expect(isCadenceCompatible(BILLING_PERIOD.WEEKLY, 1, BILLING_PERIOD.WEEKLY, 1)).toBe(true);
		expect(isCadenceCompatible(BILLING_PERIOD.WEEKLY, 2, BILLING_PERIOD.WEEKLY, 2)).toBe(true);
		expect(isCadenceCompatible(BILLING_PERIOD.WEEKLY, 2, BILLING_PERIOD.WEEKLY, 1)).toBe(false);
		expect(isCadenceCompatible(BILLING_PERIOD.MONTHLY, 1, BILLING_PERIOD.WEEKLY, 1)).toBe(false);
		expect(isCadenceCompatible(BILLING_PERIOD.WEEKLY, 1, BILLING_PERIOD.MONTHLY, 1)).toBe(false);
		expect(isCadenceCompatible(BILLING_PERIOD.MONTHLY, 1, BILLING_PERIOD.DAILY, 1)).toBe(false);
	});
});

describe('cadenceFanoutCount', () => {
	it('returns 1 for same-cadence pairs', () => {
		expect(cadenceFanoutCount(BILLING_PERIOD.MONTHLY, 1, BILLING_PERIOD.MONTHLY, 1)).toBe(1);
		expect(cadenceFanoutCount(BILLING_PERIOD.QUARTERLY, 1, BILLING_PERIOD.QUARTERLY, 1)).toBe(1);
	});

	it('returns null for ONETIME on either side (callers must short-circuit ONETIME)', () => {
		expect(cadenceFanoutCount(BILLING_PERIOD.QUARTERLY, 1, BILLING_PERIOD.ONETIME, 1)).toBeNull();
		expect(cadenceFanoutCount(BILLING_PERIOD.ONETIME, 1, BILLING_PERIOD.MONTHLY, 1)).toBeNull();
	});

	it('returns fan-out count when item is finer than sub', () => {
		expect(cadenceFanoutCount(BILLING_PERIOD.QUARTERLY, 1, BILLING_PERIOD.MONTHLY, 1)).toBe(3);
		expect(cadenceFanoutCount(BILLING_PERIOD.HALF_YEARLY, 1, BILLING_PERIOD.MONTHLY, 1)).toBe(6);
		expect(cadenceFanoutCount(BILLING_PERIOD.ANNUAL, 1, BILLING_PERIOD.MONTHLY, 1)).toBe(12);
		expect(cadenceFanoutCount(BILLING_PERIOD.ANNUAL, 1, BILLING_PERIOD.QUARTERLY, 1)).toBe(4);
		expect(cadenceFanoutCount(BILLING_PERIOD.ANNUAL, 1, BILLING_PERIOD.HALF_YEARLY, 1)).toBe(2);
	});

	it('returns null for incompatible pairs', () => {
		expect(cadenceFanoutCount(BILLING_PERIOD.MONTHLY, 1, BILLING_PERIOD.QUARTERLY, 1)).toBeNull();
		expect(cadenceFanoutCount(BILLING_PERIOD.QUARTERLY, 1, BILLING_PERIOD.ANNUAL, 1)).toBeNull();
		expect(cadenceFanoutCount(BILLING_PERIOD.WEEKLY, 1, BILLING_PERIOD.MONTHLY, 1)).toBeNull();
	});
});
