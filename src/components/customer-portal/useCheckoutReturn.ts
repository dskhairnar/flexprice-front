import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import CustomerPortalApi from '@/api/CustomerPortalApi';
import { refetchPortalQueries } from './refetchPortalQueries';
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
export const rememberPendingCheckout = (sessionId: string) => {
	try {
		sessionStorage.setItem(STORAGE_KEY, sessionId);
	} catch {
		// Private mode or blocked storage: the customer simply gets no return
		// confirmation, which is a worse experience but not a broken one.
	}
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

	const { data: session } = useQuery({
		queryKey: ['portal-checkout-session', sessionId],
		queryFn: () => CustomerPortalApi.getCheckoutSession(sessionId!),
		enabled: !!sessionId,
		// Poll while the payment is still settling; give up rather than spin forever.
		refetchInterval: (query) => {
			const status = query.state.data?.checkout_status;
			return status && TERMINAL.includes(status) ? false : 2000;
		},
	});

	useEffect(() => {
		if (!sessionId) return;
		// ~40s of settling time, then stop and let the customer refresh.
		if (attempts > 20) {
			clearPendingCheckout();
			setSessionId(null);
			return;
		}
		const timer = window.setTimeout(() => setAttempts((n) => n + 1), 2000);
		return () => window.clearTimeout(timer);
	}, [sessionId, attempts]);

	useEffect(() => {
		if (!session) return;
		const status = session.checkout_status;
		if (!TERMINAL.includes(status)) return;

		if (status === 'completed') {
			toast.success(t('checkoutReturn.completed'));
			void refetchPortalQueries(['portal-wallets', 'portal-wallet-balance', 'portal-wallet-transactions', 'portal-invoices-tab']);
		} else if (status === 'expired') {
			toast.error(t('checkoutReturn.expired'));
		} else {
			toast.error(session.failure_reason || t('checkoutReturn.failed'));
		}

		clearPendingCheckout();
		setSessionId(null);
	}, [session, t]);

	return { pendingSession: session, isResolving: !!sessionId };
};

export default useCheckoutReturn;
