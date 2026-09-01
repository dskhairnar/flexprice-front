import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { CreditCard } from 'lucide-react';
import CustomerPortalApi from '@/api/CustomerPortalApi';
import { Button, Input } from '@/components/atoms';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui';
import { refetchPortalQueries } from '../refetchPortalQueries';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { formatMoney } from '@/utils/common/formatBalance';
import type { PortalTopUpRequest, SavedPaymentMethod } from '@/types/dto/CustomerPortalBilling';
import { WalletResponse } from '@/types/dto/Wallet';
import { portalPaymentMethodsQueryKey } from '../queryKeys';
import { rememberPendingCheckout } from '../useCheckoutReturn';
import usePortalIntegrations from '../usePortalIntegrations';

interface TopUpFormProps {
	wallet: WalletResponse;
	onDone?: () => void;
	/** Surfaces the action URL so a blocked redirect stays recoverable. */
	onActionUrl?: (url: string) => void;
}

const describeCard = (method: SavedPaymentMethod) =>
	method.card?.last4 ? `${method.card.brand ?? 'card'} •••• ${method.card.last4}` : method.id;

/**
 * Credit top-up for the customer portal.
 *
 * Narrower than the admin form by design: transaction reason, expiry and priority
 * are pinned server-side, so there is no free/purchased choice and no scheduling
 * fields. There is also no save-card option — portal checkouts always vault.
 *
 * Two exits, matching how the money moves:
 *   Pay now          — checkout; credits land once payment succeeds
 *   Generate invoice — invoice raised now, settled later
 */
const TopUpForm = ({ wallet, onDone, onActionUrl }: TopUpFormProps) => {
	const { t } = useTranslation('customer-portal');
	const { supports } = usePortalIntegrations();
	const [credits, setCredits] = useState('');
	const [description, setDescription] = useState('');
	const [useSavedMethod, setUseSavedMethod] = useState(false);
	// One key per *unchanged* attempt. Retrying the same submission must reuse it so
	// the server dedups, but editing the amount after a failure makes it a different
	// request — reusing the key there could return the original checkout, or be
	// rejected, if the first call actually succeeded and only its response was lost.
	const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
	const [submittedPayload, setSubmittedPayload] = useState<string | null>(null);

	const payloadFingerprint = `${credits}|${description}|${useSavedMethod}`;
	// An edit after a failed submit invalidates the key for the next attempt.
	const keyForSubmission = submittedPayload !== null && submittedPayload !== payloadFingerprint ? crypto.randomUUID() : idempotencyKey;

	const canCheckout = supports('checkout');

	const { data: methods } = useQuery({
		queryKey: portalPaymentMethodsQueryKey,
		queryFn: () => CustomerPortalApi.getPaymentMethods(),
		enabled: canCheckout,
	});

	// Only a method that can be charged unattended is worth offering here.
	const chargeableMethod = (methods?.providers ?? [])
		.flatMap((group) => group.items)
		.find((method) => method.can_auto_charge && method.status === 'ACTIVE' && method.is_default);

	const {
		mutate: topUp,
		isPending,
		variables: pendingMode,
	} = useMutation({
		mutationFn: async (mode: 'checkout' | 'invoice') => {
			const payload: PortalTopUpRequest = {
				credits_to_add: credits,
				idempotency_key: keyForSubmission,
				...(description ? { description } : {}),
				...(mode === 'checkout'
					? {
							checkout: {
								// payment_provider omitted: the backend resolves the tenant's
								// configured provider, so the customer never learns which
								// gateway is behind the checkout.
								use_saved_method: useSavedMethod && !!chargeableMethod,
								success_url: window.location.href,
								cancel_url: window.location.href,
							},
						}
					: {}),
			};
			return CustomerPortalApi.topUpWallet(wallet.id, payload);
		},
		onMutate: () => {
			// Record what this key now belongs to, so a later edit rotates it.
			setIdempotencyKey(keyForSubmission);
			setSubmittedPayload(payloadFingerprint);
		},
		onSuccess: async (response, mode) => {
			const action = response.checkout_session?.payment_action;

			// use_saved_method can settle outright, and some providers vault
			// server-to-server — so an absent action means done, not broken.
			if (mode === 'checkout' && action?.url) {
				// Recorded before the hand-off so the outcome can be resolved on return —
				// providers redirect back without saying whether payment succeeded.
				if (response.checkout_session?.id) rememberPendingCheckout(response.checkout_session.id);
				onActionUrl?.(action.url);
				return;
			}

			toast.success(mode === 'checkout' ? t('topUp.successPending') : t('topUp.invoiceCreated'));
			setCredits('');
			setDescription('');
			setIdempotencyKey(crypto.randomUUID());
			setSubmittedPayload(null);
			onDone?.();
			await refetchPortalQueries(['portal-wallets', 'portal-wallet-balance', 'portal-wallet-transactions', 'portal-invoices-tab']);
		},
		onError: (error: Error) => toast.error(error.message || t('errors.topUp')),
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

			{chargeableMethod && (
				<div className='flex items-start gap-2 rounded-lg border p-3' style={{ borderColor: 'var(--portal-border, #E9E9E9)' }}>
					<Checkbox
						id='portal-topup-saved-method'
						checked={useSavedMethod}
						onCheckedChange={(checked) => setUseSavedMethod(checked === true)}
						disabled={isPending}
					/>
					<Label htmlFor='portal-topup-saved-method' className='text-sm font-normal leading-snug flex items-center gap-1.5'>
						<CreditCard className='h-3.5 w-3.5 shrink-0' />
						{t('topUp.useSavedMethod', { method: describeCard(chargeableMethod) })}
					</Label>
				</div>
			)}

			<div className='flex items-center gap-2 pt-1'>
				{canCheckout && (
					<Button onClick={() => topUp('checkout')} disabled={!isValid || isPending} isLoading={isPending && pendingMode === 'checkout'}>
						{t('topUp.payNow')}
					</Button>
				)}
				<Button
					variant={canCheckout ? 'outline' : 'default'}
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
