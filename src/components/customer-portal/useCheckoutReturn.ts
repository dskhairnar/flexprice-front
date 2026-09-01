import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import CustomerPortalApi from '@/api/CustomerPortalApi';
import { refreshAfterPayment } from './refetchPortalQueries';
import { subscribeToCheckoutReturn } from './checkoutHandoff';
import type { CheckoutStatus } from '@/types/dto/CustomerPortalBilling';

const STORAGE_KEY = 'flexprice.portal.pendingCheckout';

/** Statuses that will not change again, so polling can stop. */
const TERMINAL: CheckoutStatus[] = ['completed', 'failed', 'expired'];

/**
 * Remember a checkout the customer is being sent away for.
 *
 * Keyed on the session id we already hold rather than a query parameter on the
 * return URL: each provider decides what it appends coming back, and Chargebee,
 * Stripe and Razorpay do not agree. Session storage survives the round trip and
 * is scoped to the tab, so two tabs cannot claim each other's checkout.
 */
const startListeners = new Set<(sessionId: string) => void>();

export const rememberPendingCheckout = (sessionId: string) => {
	try {
		sessionStorage.setItem(STORAGE_KEY, sessionId);
	} catch {
		// Private mode or blocked storage: the customer simply gets no return
		// confirmation, which is a worse experience but not a broken one.
	}
	// The hook mounted before this checkout existed, and storage fires no event in
	// the tab that wrote it — so without this the tab that *started* the payment
	// never polls, and only a tab opened afterwards would notice the result.
	startListeners.forEach((listener) => listener(sessionId));
};

const readPendingCheckout = (): string | null => {
	try {
		return sessionStorage.getItem(STORAGE_KEY);
	} catch {
		return null;
	}
};

const clearPendingCheckout = () => {
	try {
		sessionStorage.removeItem(STORAGE_KEY);
	} catch {
		/* nothing to clear */
	}
};

/**
 * Resolves a checkout the customer has just returned from.
 *
 * The provider redirects back without telling us the outcome, and a webhook may
 * still be in flight, so the session is polled until it reaches a terminal state
 * rather than assuming success on return.
 */
const useCheckoutReturn = () => {
	const { t } = useTranslation('customer-portal');
	const [sessionId, setSessionId] = useState<string | null>(() => readPendingCheckout());
	const [attempts, setAttempts] = useState(0);
	const [isPolling, setIsPolling] = useState(true);

	// Pick up a checkout started in this tab after the hook mounted.
	useEffect(() => {
		const onStart = (started: string) => {
			setSessionId(started);
			setAttempts(0);
			setIsPolling(true);
		};
		startListeners.add(onStart);
		return () => {
			startListeners.delete(onStart);
		};
	}, []);

	// The payment tab tells us the moment the customer is redirected back, which
	// is usually long before a poll would have caught it — and after polling has
	// given up, if they spent a while on the provider's page.
	useEffect(
		() =>
			subscribeToCheckoutReturn(() => {
				setAttempts(0);
				setIsPolling(true);
			}),
		[],
	);

	const { data: session } = useQuery({
		queryKey: ['portal-checkout-session', sessionId],
		queryFn: () => CustomerPortalApi.getCheckoutSession(sessionId!),
		enabled: !!sessionId && isPolling,
		// Poll while the payment is still settling; give up rather than spin forever.
		refetchInterval: (query) => {
			const status = query.state.data?.checkout_status;
			return status && TERMINAL.includes(status) ? false : 2000;
		},
	});

	useEffect(() => {
		if (!sessionId || !isPolling) return;
		// ~40s of settling time, then rest. The session id is deliberately kept:
		// a customer can sit on the provider's page far longer than that, and
		// dropping it here would leave the return announcement with nothing to
		// resolve. Polling resumes when that announcement arrives.
		if (attempts > 20) {
			setIsPolling(false);
			return;
		}
		const timer = window.setTimeout(() => setAttempts((n) => n + 1), 2000);
		return () => window.clearTimeout(timer);
	}, [sessionId, attempts, isPolling]);

	useEffect(() => {
		if (!session) return;
		const status = session.checkout_status;
		if (!TERMINAL.includes(status)) return;

		if (status === 'completed') {
			toast.success(t('checkoutReturn.completed'));
			void refreshAfterPayment();
		} else if (status === 'expired') {
			toast.error(t('checkoutReturn.expired'));
		} else {
			toast.error(session.failure_reason || t('checkoutReturn.failed'));
		}

		clearPendingCheckout();
		setSessionId(null);
		setIsPolling(false);
	}, [session, t]);

	return { pendingSession: session, isResolving: !!sessionId };
};

export default useCheckoutReturn;
