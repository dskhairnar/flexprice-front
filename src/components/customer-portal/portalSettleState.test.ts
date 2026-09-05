import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

let cache: Record<string, unknown> = {};
const refetchQueries = vi.fn();

vi.mock('@/core/services/tanstack/ReactQueryProvider', () => ({
	refetchQueries: (...args: unknown[]) => refetchQueries(...args),
	queryClient: { getQueryData: (key: readonly string[]) => cache[key[0]] },
}));

const { beginSettle, endSettle, isSettling, subscribeToSettle, resetSettleState } = await import('./portalSettleState');
const { refreshAfterPayment, refreshAfterFailedPayment } = await import('./refetchPortalQueries');

beforeEach(() => {
	resetSettleState();
	refetchQueries.mockReset();
	refetchQueries.mockResolvedValue(undefined);
	cache = {};
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

describe('settle flag', () => {
	// Two payments can settle at once — a checkout return and an invoice payment.
	// A boolean would let the first to finish clear the second's flag, dropping the
	// skeletons back to figures the other refetch has not updated yet.
	it('stays set until the last settle finishes', () => {
		beginSettle();
		beginSettle();
		endSettle();
		expect(isSettling()).toBe(true);
		endSettle();
		expect(isSettling()).toBe(false);
	});

	it('cannot be driven below zero by an unmatched end', () => {
		endSettle();
		expect(isSettling()).toBe(false);
		beginSettle();
		expect(isSettling()).toBe(true);
	});

	it('notifies subscribers on each change', () => {
		const listener = vi.fn();
		const unsubscribe = subscribeToSettle(listener);

		beginSettle();
		endSettle();
		expect(listener).toHaveBeenCalledTimes(2);

		unsubscribe();
		beginSettle();
		expect(listener).toHaveBeenCalledTimes(2);
	});
});

describe('refreshAfterPayment', () => {
	// The point of the flag: the window covers the whole retry schedule, so widgets
	// show skeletons rather than the pre-payment balance the cache still holds.
	it('is settling for the duration and clear afterwards', async () => {
		cache = { 'portal-wallets': 'before' };
		const pending = refreshAfterPayment();

		expect(isSettling()).toBe(true);
		await vi.runAllTimersAsync();
		await pending;
		expect(isSettling()).toBe(false);
	});

	it('clears the flag even when a refetch rejects', async () => {
		refetchQueries.mockRejectedValue(new Error('network'));

		await expect(refreshAfterPayment()).rejects.toThrow('network');
		expect(isSettling()).toBe(false);
	});
});

describe('refreshAfterFailedPayment', () => {
	// A failed attempt still moves state the customer sees, so it refetches once —
	// but without the settle schedule, since nothing new is expected to arrive.
	it('refetches every balance root exactly once', async () => {
		await refreshAfterFailedPayment();

		const roots = refetchQueries.mock.calls.map(([key]) => key);
		expect(roots).toContain('portal-wallets');
		expect(roots).toContain('portal-invoices-tab');
		expect(new Set(roots).size).toBe(roots.length);
		expect(isSettling()).toBe(false);
	});

	it('passes extra keys through', async () => {
		await refreshAfterFailedPayment(['portal-invoice']);

		expect(refetchQueries.mock.calls.map(([key]) => key)).toContain('portal-invoice');
	});
});
