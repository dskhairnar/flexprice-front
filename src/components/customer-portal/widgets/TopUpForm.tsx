import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import CustomerPortalApi from '@/api/CustomerPortalApi';
import { Button, Input } from '@/components/atoms';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { formatMoney } from '@/utils/common/formatBalance';
import { PortalTopUpRequest } from '@/types/dto/CustomerPortalBilling';
import { WalletResponse } from '@/types/dto/Wallet';

const PRESET_CREDITS = ['10', '25', '50', '100'];

interface TopUpFormProps {
	wallet: WalletResponse;
	onDone?: () => void;
}

/**
 * Amount entry for a wallet top-up.
 *
 * The request always opts into `checkout`, so the customer is charged before any
 * credit lands. The backend replies with the session to redirect to; credits are
 * applied by the payment webhook, not by this call.
 */
const TopUpForm = ({ wallet, onDone }: TopUpFormProps) => {
	const { t } = useTranslation('customer-portal');
	const [credits, setCredits] = useState('');
	// One key per mounted attempt, so a retry after a network failure dedups server
	// side instead of granting the credits twice. Reset only after a success.
	const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());

	const { mutate: topUp, isPending } = useMutation({
		mutationFn: async (creditsToAdd: string) => {
			const payload: PortalTopUpRequest = {
				credits_to_add: creditsToAdd,
				idempotency_key: idempotencyKey,
				checkout: {
					// Razorpay is the only value CheckoutPaymentProvider accepts today
					// (internal/types/checkout.go) — anything else is rejected as a
					// validation error. This belongs server-side once the backend
					// resolves the tenant's configured gateway itself, so the portal
					// customer never learns which gateway is behind the checkout.
					payment_provider: 'razorpay',
					success_url: window.location.href,
					cancel_url: window.location.href,
				},
			};
			return CustomerPortalApi.topUpWallet(wallet.id, payload);
		},
		onSuccess: async (response) => {
			const redirectUrl = response.checkout_session?.payment_action?.redirect_url ?? response.checkout_session?.payment_url;

			if (redirectUrl) {
				// Hand off to the hosted checkout page; credits land once payment succeeds.
				window.location.href = redirectUrl;
				return;
			}

			// No checkout session came back — the top-up was invoiced instead, so
			// refresh the balance rather than leaving the customer on a stale figure.
			toast.success(t('topUp.successPending'));
			setCredits('');
			setIdempotencyKey(crypto.randomUUID());
			onDone?.();
			await refetchQueries(['portal-wallets', 'portal-wallet-balance', 'portal-wallet-transactions']);
		},
		onError: () => toast.error(t('errors.topUp')),
	});

	const parsedCredits = Number(credits);
	const isValid = credits !== '' && Number.isFinite(parsedCredits) && parsedCredits > 0;

	const currencySymbol = getCurrencySymbol(wallet.currency ?? 'USD');
	const conversionRate = Number(wallet.conversion_rate ?? 1) || 1;
	const chargeAmount = isValid ? formatMoney(parsedCredits * conversionRate) : null;

	return (
		<div>
			<div className='flex flex-wrap gap-2 mb-4'>
				{PRESET_CREDITS.map((preset) => (
					<button
						key={preset}
						type='button'
						onClick={() => setCredits(preset)}
						disabled={isPending}
						aria-pressed={credits === preset}
						className='px-4 py-2 text-sm rounded-lg border transition-colors disabled:opacity-50'
						style={{
							borderColor: credits === preset ? 'var(--portal-primary, #2563eb)' : 'var(--portal-border, #E9E9E9)',
							color: credits === preset ? 'var(--portal-primary, #2563eb)' : 'var(--portal-text-primary, #09090b)',
						}}>
						{preset} {t('wallet.credits')}
					</button>
				))}
			</div>

			<Input
				label={t('topUp.creditsLabel')}
				type='number'
				value={credits}
				onChange={setCredits}
				disabled={isPending}
				placeholder={t('topUp.creditsPlaceholder')}
				className='mb-3'
			/>

			{/* States the charge before the customer commits — the confirm button charges immediately. */}
			{chargeAmount && (
				<p className='text-sm mb-4' style={{ color: 'var(--portal-text-secondary, #71717a)' }}>
					{t('topUp.chargeSummary', { amount: `${currencySymbol}${chargeAmount}` })}
				</p>
			)}

			<Button onClick={() => topUp(credits)} disabled={!isValid || isPending} isLoading={isPending}>
				{t('topUp.action')}
			</Button>
		</div>
	);
};

export default TopUpForm;
