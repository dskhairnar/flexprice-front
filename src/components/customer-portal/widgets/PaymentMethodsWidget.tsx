import { useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { CreditCard, Plus } from 'lucide-react';
import CustomerPortalApi from '@/api/CustomerPortalApi';
import { Button, Card, Chip } from '@/components/atoms';
import { PortalPaymentMethod } from '@/types/dto/CustomerPortalBilling';
import { portalPaymentMethodsQueryKey } from '../queryKeys';
import EmptyState from '../EmptyState';

interface PaymentMethodsWidgetProps {
	label?: string;
}

const formatExpiry = (month?: number, year?: number) => {
	if (!month || !year) return null;
	return `${String(month).padStart(2, '0')}/${String(year).slice(-2)}`;
};

interface PaymentMethodRowProps {
	method: PortalPaymentMethod;
	onSetDefault: (paymentMethodId: string) => void;
	isSettingDefault: boolean;
}

const PaymentMethodRow = ({ method, onSetDefault, isSettingDefault }: PaymentMethodRowProps) => {
	const { t } = useTranslation('customer-portal');
	const card = method.payment_method_details?.card;
	const expiry = formatExpiry(card?.exp_month, card?.exp_year);

	return (
		<div
			className='flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0'
			style={{ borderBottom: '1px solid var(--portal-border, #E9E9E9)' }}>
			<div className='flex items-center gap-3 min-w-0'>
				<div
					className='h-9 w-9 rounded-full flex items-center justify-center shrink-0'
					style={{ backgroundColor: 'var(--portal-bg, #eff6ff)' }}>
					<CreditCard className='h-4 w-4' style={{ color: 'var(--portal-primary, #2563eb)' }} />
				</div>
				<div className='min-w-0'>
					<p className='text-sm font-medium truncate' style={{ color: 'var(--portal-text-primary, #09090b)' }}>
						{card ? t('paymentMethods.cardLabel', { brand: card.brand, last4: card.last4 }) : method.payment_method_id || method.id}
					</p>
					{expiry && (
						<p className='text-xs' style={{ color: 'var(--portal-text-secondary, #71717a)' }}>
							{t('paymentMethods.expires', { expiry })}
						</p>
					)}
				</div>
			</div>
			<div className='flex items-center gap-2 shrink-0'>
				{method.is_default ? (
					<Chip label={t('paymentMethods.default')} variant='success' />
				) : (
					method.payment_method_id && (
						<Button variant='ghost' size='xs' onClick={() => onSetDefault(method.payment_method_id!)} disabled={isSettingDefault}>
							{t('paymentMethods.setDefault')}
						</Button>
					)
				)}
			</div>
		</div>
	);
};

/**
 * Lists the customer's saved cards and starts a hosted card-capture session.
 *
 * Only Stripe is exposed on the portal today, so the list reads the `stripe`
 * group of the multi-provider response.
 */
const PaymentMethodsWidget = ({ label }: PaymentMethodsWidgetProps) => {
	const { t } = useTranslation('customer-portal');

	const { data, isLoading, isError } = useQuery({
		queryKey: portalPaymentMethodsQueryKey,
		queryFn: () => CustomerPortalApi.getPaymentMethods({ provider: 'stripe' }),
	});

	const { mutate: addPaymentMethod, isPending } = useMutation({
		mutationFn: () =>
			CustomerPortalApi.addPaymentMethod({
				provider: 'stripe',
				success_url: window.location.href,
				cancel_url: window.location.href,
			}),
		onSuccess: (response) => {
			if (!response.checkout_url) {
				toast.error(t('errors.addPaymentMethod'));
				return;
			}
			// The card is captured on the provider's hosted page, not in the portal.
			window.location.href = response.checkout_url;
		},
		onError: () => toast.error(t('errors.addPaymentMethod')),
	});

	const { mutate: setDefault, isPending: isSettingDefault } = useMutation({
		mutationFn: (paymentMethodId: string) => CustomerPortalApi.setDefaultPaymentMethod({ payment_method_id: paymentMethodId }),
		onSuccess: async () => {
			toast.success(t('paymentMethods.defaultUpdated'));
			await refetchQueries(['portal-payment-methods']);
		},
		onError: () => toast.error(t('errors.setDefaultPaymentMethod')),
	});

	useEffect(() => {
		if (isError) toast.error(t('errors.loadPaymentMethods'));
	}, [isError, t]);

	const methods = data?.stripe ?? [];

	return (
		<Card
			className='rounded-xl p-6'
			style={{ backgroundColor: 'var(--portal-surface, white)', border: '1px solid var(--portal-border, #E9E9E9)' }}>
			<div className='flex items-center justify-between gap-4 mb-5'>
				<div>
					<h3 className='text-base font-medium mb-1' style={{ color: 'var(--portal-text-primary, #09090b)' }}>
						{label ?? t('paymentMethods.title')}
					</h3>
					<p className='text-sm' style={{ color: 'var(--portal-text-secondary, #71717a)' }}>
						{t('paymentMethods.description')}
					</p>
				</div>
				<Button onClick={() => addPaymentMethod()} isLoading={isPending} prefixIcon={<Plus />} className='shrink-0'>
					{t('paymentMethods.add')}
				</Button>
			</div>

			{isLoading ? (
				<div className='animate-pulse space-y-3'>
					{[1, 2].map((i) => (
						<div key={i} className='h-12 bg-zinc-100 rounded'></div>
					))}
				</div>
			) : methods.length > 0 ? (
				<div className='divide-y' style={{ borderColor: 'var(--portal-border, #E9E9E9)' }}>
					{methods.map((method) => (
						<PaymentMethodRow key={method.id} method={method} onSetDefault={setDefault} isSettingDefault={isSettingDefault} />
					))}
				</div>
			) : (
				<EmptyState title={t('paymentMethods.emptyTitle')} description={t('paymentMethods.emptyDescription')} />
			)}
		</Card>
	);
};

export default PaymentMethodsWidget;
