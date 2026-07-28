import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { formatBillingPeriod, formatBillingPeriodDate } from './format_date';

const IST = 'Asia/Kolkata';
const previousTz = process.env.TZ;

describe('formatBillingPeriodDate / formatBillingPeriod (Asia/Kolkata)', () => {
	beforeAll(() => {
		process.env.TZ = IST;
		// Fail fast if the runner ignores mid-process TZ changes.
		expect(new Date().getTimezoneOffset()).toBe(-330);
	});

	afterAll(() => {
		if (previousTz === undefined) {
			delete process.env.TZ;
		} else {
			process.env.TZ = previousTz;
		}
	});

	test('utc zone uses the UTC calendar day for IST midnight instants', () => {
		// 31 Jul 00:00 IST == 30 Jul 18:30 UTC
		expect(formatBillingPeriodDate('2025-07-30T18:30:00.000Z', 'utc')).toBe('30 Jul');
	});

	test('local zone uses the local calendar day for IST midnight instants', () => {
		expect(formatBillingPeriodDate('2025-07-30T18:30:00.000Z', 'local')).toBe('31 Jul');
		expect(formatBillingPeriodDate('2025-07-30T18:30:00.000Z', 'utc')).toBe('30 Jul');
	});

	test('formats exclusive end in local time (not UTC)', () => {
		// Exclusive end at 31 Jul 00:00 UTC → last included instant is still 31 Jul in IST
		expect(formatBillingPeriod('2025-07-01T00:00:00.000Z', '2025-07-31T00:00:00.000Z')).toBe('1 Jul - 31 Jul');
	});

	test('IST-aligned exclusive month end shows last included day', () => {
		// [1 Jul 00:00 IST, 1 Aug 00:00 IST)
		expect(formatBillingPeriod('2025-06-30T18:30:00.000Z', '2025-07-31T18:30:00.000Z')).toBe('1 Jul - 31 Jul');
	});
});
