import { describe, expect, test } from 'vitest';
import { formatBillingPeriod, formatBillingPeriodDate } from './format_date';

describe('formatBillingPeriodDate', () => {
	test('utc zone uses the UTC calendar day for IST midnight instants', () => {
		// 31 Jul 00:00 IST == 30 Jul 18:30 UTC
		expect(formatBillingPeriodDate('2025-07-30T18:30:00.000Z', 'utc')).toBe('30 Jul');
	});

	test('local zone uses the local calendar day for IST midnight instants', () => {
		const local = formatBillingPeriodDate('2025-07-30T18:30:00.000Z', 'local');
		const utc = formatBillingPeriodDate('2025-07-30T18:30:00.000Z', 'utc');
		// East of UTC (e.g. IST): local is the next calendar day
		if (new Date().getTimezoneOffset() < 0) {
			expect(local).toBe('31 Jul');
			expect(utc).toBe('30 Jul');
		} else {
			expect(local).toBe(utc);
		}
	});
});

describe('formatBillingPeriod', () => {
	test('formats exclusive end in local time (not UTC)', () => {
		const periodEnd = '2025-07-31T00:00:00.000Z';
		const endMinusOneSec = new Date(new Date(periodEnd).getTime() - 1000).toISOString();
		const expectedEnd = formatBillingPeriodDate(endMinusOneSec, 'local');
		const result = formatBillingPeriod('2025-07-01T00:00:00.000Z', periodEnd);

		expect(result.endsWith(expectedEnd)).toBe(true);
		// Must not keep the old UTC-only end (30 Jul for +offset zones).
		if (new Date().getTimezoneOffset() < 0) {
			expect(expectedEnd).toBe('31 Jul');
			expect(result).not.toMatch(/30 Jul$/);
		}
	});

	test('IST-aligned exclusive month end still shows last included day', () => {
		const result = formatBillingPeriod('2025-06-30T18:30:00.000Z', '2025-07-31T18:30:00.000Z');
		const expectedEnd = formatBillingPeriodDate(new Date(new Date('2025-07-31T18:30:00.000Z').getTime() - 1000).toISOString(), 'local');
		expect(result.endsWith(expectedEnd)).toBe(true);
		if (new Date().getTimezoneOffset() === -330) {
			expect(result).toBe('1 Jul - 31 Jul');
		}
	});
});
