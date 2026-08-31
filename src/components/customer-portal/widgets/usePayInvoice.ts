import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import CustomerPortalApi from '@/api/CustomerPortalApi';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';

/**
 * Starts a hosted payment for an invoice and hands off to the returned URL.
 *
 * The URL is surfaced to the caller before the redirect, so a portal embedded in
 * an iframe — or any context where a programmatic redirect is blocked — still
 * leaves the customer a link they can open or copy.
 */
const usePayInvoice = () => {
	const { t } = useTranslation('customer-portal');
	const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
	// One key per invoice, so retrying a failed attempt dedups rather than raising
	// a second payment against the same invoice.
	const [keys] = useState(() => new Map<string, string>());

	const mutation = useMutation({
		mutationFn: (invoiceId: string) => {
			if (!keys.has(invoiceId)) keys.set(invoiceId, crypto.randomUUID());
			return CustomerPortalApi.payInvoiceWithCheckout(invoiceId, {
				idempotency_key: keys.get(invoiceId)!,
				success_url: window.location.href,
				cancel_url: window.location.href,
			});
		},
		onSuccess: async (response, invoiceId) => {
			if (response.payment_url) {
				setCheckoutUrl(response.payment_url);
				window.location.href = response.payment_url;
				return;
			}
			// No URL came back — the gateway settled it inline, so refresh rather
			// than leaving the customer looking at a stale status.
			keys.delete(invoiceId);
			toast.success(t('toast.invoicePaymentStarted'));
			await refetchQueries(['portal-invoices-tab', 'portal-invoice', 'portal-wallets']);
		},
		onError: () => toast.error(t('errors.payInvoice')),
	});

	return {
		payInvoice: mutation.mutate,
		isPaying: mutation.isPending,
		payingInvoiceId: mutation.isPending ? (mutation.variables ?? null) : null,
		checkoutUrl,
		clearCheckoutUrl: () => setCheckoutUrl(null),
	};
};

export default usePayInvoice;
