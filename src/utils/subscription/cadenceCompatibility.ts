import { BILLING_PERIOD } from '@/constants/constants';

const MONTHS_PER_PERIOD: Partial<Record<BILLING_PERIOD, number>> = {
	[BILLING_PERIOD.MONTHLY]: 1,
	[BILLING_PERIOD.QUARTERLY]: 3,
	[BILLING_PERIOD.HALF_YEARLY]: 6,
	[BILLING_PERIOD.ANNUAL]: 12,
};

/** Effective months for a (period, count). Returns null for DAILY/WEEKLY/ONETIME — no clean month equivalent. */
export function billingPeriodMonths(period: BILLING_PERIOD | string, count: number = 1): number | null {
	const key = String(period).toUpperCase() as BILLING_PERIOD;
	const base = MONTHS_PER_PERIOD[key];
	if (base == null) return null;
	return base * Math.max(1, count);
}

/**
 * Mirrors backend `types.IsCadenceCompatible` exactly: reports whether a line-item cadence
 * (itemPeriod × itemCount) equals or strictly divides a subscription cadence
 * (subPeriod × subCount) on the recurring scale. Backend fans out the finer item into N
 * line items per invoice (e.g. monthly price on a quarterly sub → 3 line items).
 *
 *  - Returns **false** if either side is ONETIME. ONETIME is not on the recurring scale;
 *    callers that want the "ONETIME is always valid" attach rule must handle it before
 *    invoking this primitive (see backend `filterValidPricesForSubscription`).
 *  - Same period AND same count is always compatible (covers DAILY×N / WEEKLY×N where
 *    month math does not apply).
 *  - Otherwise both sides must reduce to positive months and `subMonths % itemMonths === 0`.
 */
export function isCadenceCompatible(
	subPeriod: BILLING_PERIOD | string,
	subCount: number | undefined,
	itemPeriod: BILLING_PERIOD | string,
	itemCount: number | undefined,
): boolean {
	const subKey = String(subPeriod).toUpperCase();
	const itemKey = String(itemPeriod).toUpperCase();
	if (subKey === BILLING_PERIOD.ONETIME || itemKey === BILLING_PERIOD.ONETIME) return false;

	const sc = Math.max(1, subCount ?? 1);
	const ic = Math.max(1, itemCount ?? 1);
	if (subKey === itemKey && sc === ic) return true;

	const subMonths = billingPeriodMonths(subKey, sc);
	const itemMonths = billingPeriodMonths(itemKey, ic);
	if (subMonths == null || itemMonths == null || itemMonths === 0) return false;
	return subMonths % itemMonths === 0;
}

/**
 * Line-item cycles per subscription invoice window for a compatible pair (1 for
 * same-cadence pairs). Returns null when the pair is not compatible on the recurring
 * scale — including ONETIME on either side (callers should short-circuit ONETIME
 * before invoking, since ONETIME line items produce a single charge, not a fan-out).
 */
export function cadenceFanoutCount(
	subPeriod: BILLING_PERIOD | string,
	subCount: number | undefined,
	itemPeriod: BILLING_PERIOD | string,
	itemCount: number | undefined,
): number | null {
	if (!isCadenceCompatible(subPeriod, subCount, itemPeriod, itemCount)) return null;
	const subMonths = billingPeriodMonths(subPeriod, subCount);
	const itemMonths = billingPeriodMonths(itemPeriod, itemCount);
	if (subMonths == null || itemMonths == null || itemMonths === 0) return 1;
	return subMonths / itemMonths;
}
