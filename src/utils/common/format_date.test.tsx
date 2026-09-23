import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import {
	formatBillingPeriod,
	formatBillingPeriodDate,
	formatBillingPeriodLong,
	formatPeriodEndFull,
	toInclusivePeriodEnd,
} from './format_date';

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

	// Both shapes below are real: a scan of the dev backend found periods anchored to UTC
	// midnight (`…T00:00:00Z`) and to IST midnight (`…T18:30:00Z`). The exclusive end must resolve
	// to the same last day for either, and regardless of where the viewer sits.
	test('quarterly period ending at UTC midnight shows the last day of the quarter', () => {
		// API: 1 Jun 00:00 UTC → 1 Sep 00:00 UTC (exclusive). Jun–Aug quarter.
		expect(formatBillingPeriod('2026-06-01T00:00:00.000Z', '2026-09-01T00:00:00.000Z')).toBe('1 Jun - 31 Aug');
	});

	test('quarterly period ending at IST midnight shows the last day of the quarter', () => {
		// API: 1 Jun 00:00 IST → 1 Sep 00:00 IST (exclusive).
		expect(formatBillingPeriod('2026-05-31T18:30:00.000Z', '2026-08-31T18:30:00.000Z')).toBe('1 Jun - 31 Aug');
	});

	test('monthly period ending at UTC midnight shows the last day of the month', () => {
		expect(formatBillingPeriod('2025-07-01T00:00:00.000Z', '2025-08-01T00:00:00.000Z')).toBe('1 Jul - 31 Jul');
	});

	test('mid-month anchored period keeps the day before the next anchor', () => {
		// Subscription-anchored periods are the common case on the backend: 29th to 29th.
		expect(formatBillingPeriod('2026-07-29T00:00:00.000Z', '2026-08-29T00:00:00.000Z')).toBe('29 Jul - 28 Aug');
	});
});

describe('formatPeriodEndFull', () => {
	test('names the last day of the period as a full date', () => {
		// The read-only period end on the edit-invoice screen.
		expect(formatPeriodEndFull('2026-09-01T00:00:00.000Z')).toBe('Aug 31, 2026');
		expect(formatPeriodEndFull('2026-06-30T18:30:00.000Z')).toBe('Jun 30, 2026');
	});

	test('reports an unparseable end instead of rendering a wrong date', () => {
		expect(formatPeriodEndFull('not-a-date')).toBe('Invalid Date');
	});
});

describe('formatBillingPeriodLong', () => {
	test('renders the full date range with an inclusive end', () => {
		expect(formatBillingPeriodLong('2026-06-01T00:00:00.000Z', '2026-09-01T00:00:00.000Z')).toBe('Jun 1, 2026 – Aug 31, 2026');
	});

	test('reports an unparseable bound instead of rendering a wrong date', () => {
		expect(formatBillingPeriodLong('2026-06-01T00:00:00.000Z', 'not-a-date')).toBe('Invalid Date');
	});
});

describe('toInclusivePeriodEnd', () => {
	test('steps an exclusive end back to the final second of the period', () => {
		expect(toInclusivePeriodEnd('2026-06-01T00:00:00.000Z').toISOString()).toBe('2026-05-31T23:59:59.000Z');
	});

	test('the shifted instant only reads as the previous day in UTC, not in IST', () => {
		// Why formatPeriodEndDate renders in UTC: locally this instant is still 1 Jun in IST.
		const shifted = toInclusivePeriodEnd('2026-06-01T00:00:00.000Z');
		expect(formatBillingPeriodDate(shifted, 'utc')).toBe('31 May');
		expect(formatBillingPeriodDate(shifted, 'local')).toBe('1 Jun');
	});

	test('accepts a Date and leaves the input untouched', () => {
		const end = new Date('2026-06-01T00:00:00.000Z');
		expect(toInclusivePeriodEnd(end).toISOString()).toBe('2026-05-31T23:59:59.000Z');
		expect(end.toISOString()).toBe('2026-06-01T00:00:00.000Z');
	});

	test('passes an unparseable date through instead of inventing one', () => {
		expect(isNaN(toInclusivePeriodEnd('not-a-date').getTime())).toBe(true);
	});
});
