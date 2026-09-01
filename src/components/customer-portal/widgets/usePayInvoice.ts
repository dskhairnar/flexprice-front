import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import CustomerPortalApi from '@/api/CustomerPortalApi';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { openPaymentUrl } from '@/utils/common/openPaymentUrl';

/**
 * Starts payment for an invoice and follows the returned action.
 *
 * The amount comes from the invoice — a customer cannot part-pay — and paying
 * never vaults a card, so there is nothing to ask before submitting.
 *
 * The URL is surfaced as well as opened: the open runs in an async callback after
 * the request returns, not directly in the click, which is what popup blockers
 * stop. An action with no URL means the provider settled it outright.
 */
const usePayInvoice = () => {
	const { t } = useTranslation('customer-portal');
	const [actionUrl, setActionUrl] = useState<string | null>(null);
	// One key per invoice, so retrying a failed attempt dedups rather than raising
	// a second payment against the same invoice.
	const [keys] = useState(() => new Map<string, string>());

	const mutation = useMutation({
		mutationFn: (invoiceId: string) => {
			if (!keys.has(invoiceId)) keys.set(invoiceId, crypto.randomUUID());
			return CustomerPortalApi.payInvoice(invoiceId, {
				idempotency_key: keys.get(invoiceId),
				success_url: window.location.href,
				cancel_url: window.location.href,
			});
		},
		onSuccess: async (response, invoiceId) => {
			const url = response.payment_action?.url;
			if (url) {
				setActionUrl(url);
				openPaymentUrl(url);
				return;
			}
			keys.delete(invoiceId);
			toast.success(t('toast.invoicePaymentStarted'));
			await refetchQueries(['portal-invoices-tab', 'portal-invoice', 'portal-wallets']);
		},
		onError: (error: Error) => toast.error(error.message || t('errors.payInvoice')),
	});

	return {
		payInvoice: mutation.mutate,
		isPaying: mutation.isPending,
		payingInvoiceId: mutation.isPending ? (mutation.variables ?? null) : null,
		checkoutUrl: actionUrl,
		clearCheckoutUrl: () => setActionUrl(null),
	};
};

export default usePayInvoice;
