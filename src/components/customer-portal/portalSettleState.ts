import { useSyncExternalStore } from 'react';

/**
 * Whether a payment's after-effects are still being fetched.
 *
 * A completed checkout is not the end of the story: the transaction, the invoice
 * and the balance are written by a webhook that lands a moment later, so the
 * portal re-checks on a short schedule (see refreshAfterPayment). During that
 * window the cached data is stale but React Query's `isLoading` is false — it has
 * data, just the wrong data — so nothing in the UI marked itself as busy and the
 * customer watched their old balance sit there for several seconds after paying.
 *
 * A counter rather than a boolean: an invoice payment and a checkout return can
 * both be settling, and the first to finish must not clear the other's flag.
 */
let settling = 0;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

export const beginSettle = () => {
	settling += 1;
	emit();
};

export const endSettle = () => {
	settling = Math.max(0, settling - 1);
	emit();
};

export const isSettling = () => settling > 0;

export const subscribeToSettle = (listener: () => void) => {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
};

/** Test-only: drop state between cases so a leaked settle cannot bleed across. */
export const resetSettleState = () => {
	settling = 0;
	listeners.clear();
};

/**
 * True while a payment's data is being refetched.
 *
 * Widgets showing money that a payment moves use this to fall back to their
 * loading state, so the figure is replaced by a skeleton rather than quietly
 * remaining wrong until the refetch lands.
 */
export const usePortalSettling = () => useSyncExternalStore(subscribeToSettle, isSettling, () => false);
