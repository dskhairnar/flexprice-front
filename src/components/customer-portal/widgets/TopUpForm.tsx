import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import CustomerPortalApi from '@/api/CustomerPortalApi';
import { Button, Input } from '@/components/atoms';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { formatMoney } from '@/utils/common/formatBalance';
import { PortalTopUpRequest } from '@/types/dto/CustomerPortalBilling';
import { WalletResponse } from '@/types/dto/Wallet';

interface TopUpFormProps {
	wallet: WalletResponse;
	onDone?: () => void;
	/** Surfaces the hosted-checkout URL when the browser will not follow the redirect. */
	onCheckoutUrl?: (url: string) => void;
}

/**
 * Credit top-up for the customer portal.
 *
 * Mirrors the admin top-up form minus the parts a customer has no business
 * setting: there is no free/purchased choice (the backend pins a purchased-credit
 * reason), and no expiry, priority or reference id. An invoice is always raised.
 *
 * Two exits, matching how the money actually moves:
 *   Pay now         — hosted checkout, credits land once payment succeeds
 *   Generate invoice — invoice raised now, settled later
 */
const TopUpForm = ({ wallet, onDone, onCheckoutUrl }: TopUpFormProps) => {
	const { t } = useTranslation('customer-portal');
	const [credits, setCredits] = useState('');
	const [description, setDescription] = useState('');
	const [saveCard, setSaveCard] = useState(false);
	// One key per mounted attempt, so a retry after a network failure dedups server
	// side instead of granting the credits twice. Reset only after a success.
	const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());

	const {
		mutate: topUp,
		isPending,
		variables: pendingMode,
	} = useMutation({
		mutationFn: async (mode: 'checkout' | 'invoice') => {
			const payload: PortalTopUpRequest = {
				credits_to_add: credits,
				idempotency_key: idempotencyKey,
				...(description ? { description } : {}),
				...(mode === 'checkout'
					? {
							checkout: {
								// Razorpay is the only value CheckoutPaymentProvider accepts today
								// (internal/types/checkout.go). This belongs server-side once the
								// backend resolves the tenant's configured gateway itself, so the
								// customer never learns which gateway is behind the checkout.
								payment_provider: 'razorpay',
								payment_provider_config: {
									// charge_automatically is what saves the card for future invoices.
									// max_mandate_limit is deliberately omitted — a one-off top-up
									// needs no recurring-debit mandate.
									collection_method: saveCard ? 'charge_automatically' : 'send_invoice',
								},
								success_url: window.location.href,
								cancel_url: window.location.href,
							},
						}
					: {}),
			};
			return CustomerPortalApi.topUpWallet(wallet.id, payload);
		},
		onSuccess: async (response, mode) => {
			const redirectUrl = response.checkout_session?.payment_action?.redirect_url ?? response.checkout_session?.payment_url;

			if (mode === 'checkout' && redirectUrl) {
				// Surface the URL first, so a blocked redirect still leaves the customer
				// something they can copy, then hand off to the hosted page.
				onCheckoutUrl?.(redirectUrl);
				window.location.href = redirectUrl;
				return;
			}

			toast.success(mode === 'checkout' ? t('topUp.successPending') : t('topUp.invoiceCreated'));
			setCredits('');
			setDescription('');
			setIdempotencyKey(crypto.randomUUID());
			onDone?.();
			await refetchQueries(['portal-wallets', 'portal-wallet-balance', 'portal-wallet-transactions', 'portal-invoices-tab']);
		},
		onError: () => toast.error(t('errors.topUp')),
	});

	const parsedCredits = Number(credits);
	const isValid = credits !== '' && Number.isFinite(parsedCredits) && parsedCredits > 0;

	const currencySymbol = getCurrencySymbol(wallet.currency ?? 'USD');
	const conversionRate = Number(wallet.conversion_rate ?? 1) || 1;
	const chargeAmount = isValid ? formatMoney(parsedCredits * conversionRate) : null;

	return (
		<div className='space-y-4'>
			<Input
				label={t('topUp.creditsLabel')}
				type='number'
				value={credits}
				onChange={setCredits}
				disabled={isPending}
				placeholder={t('topUp.creditsPlaceholder')}
				suffix={t('wallet.credits')}
				description={chargeAmount ? t('topUp.chargeSummary', { amount: `${currencySymbol}${chargeAmount}` }) : undefined}
			/>

			<Input
				label={t('topUp.descriptionLabel')}
				value={description}
				onChange={setDescription}
				disabled={isPending}
				placeholder={t('topUp.descriptionPlaceholder')}
			/>

			<div className='flex items-start gap-2'>
				<Checkbox
					id='portal-topup-save-card'
					checked={saveCard}
					onCheckedChange={(checked) => setSaveCard(checked === true)}
					disabled={isPending}
				/>
				<Label htmlFor='portal-topup-save-card' className='text-sm font-normal leading-snug'>
					{t('topUp.saveCardLabel')}
				</Label>
			</div>

			<div className='flex items-center gap-2 pt-1'>
				<Button onClick={() => topUp('checkout')} disabled={!isValid || isPending} isLoading={isPending && pendingMode === 'checkout'}>
					{t('topUp.payNow')}
				</Button>
				<Button
					variant='outline'
					onClick={() => topUp('invoice')}
					disabled={!isValid || isPending}
					isLoading={isPending && pendingMode === 'invoice'}>
					{t('topUp.generateInvoice')}
				</Button>
			</div>
		</div>
	);
};

export default TopUpForm;
