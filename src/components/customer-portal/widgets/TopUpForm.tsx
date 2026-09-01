import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import CustomerPortalApi from '@/api/CustomerPortalApi';
import { portalReturnUrl } from '../portalReturnUrl';
import { Button, Input, Select, Toggle } from '@/components/atoms';
import { refetchPortalQueries } from '../refetchPortalQueries';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { formatMoney } from '@/utils/common/formatBalance';
import type { PaymentGatewayType, PortalTopUpRequest, SavedPaymentMethod } from '@/types/dto/CustomerPortalBilling';
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
	const { maySupport, supports, providersFor } = usePortalIntegrations();
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

	// Optimistic: only hidden when /integrations has loaded and names no checkout
	// provider. A slow or failing integrations call must not remove the pay button.
	const canCheckout = maySupport('checkout');

	// The resolver refuses to guess: with more than one checkout-capable gateway it
	// returns "Specify which payment provider to use" rather than falling back to a
	// default, so the provider is always named explicitly.
	const checkoutProviders = providersFor('checkout');
	const [selectedProvider, setSelectedProvider] = useState<PaymentGatewayType | ''>('');
	// providersFor sorts the capability default first, so [0] is the tenant's pick.
	const effectiveProvider = selectedProvider || checkoutProviders[0];

	const { data: methods } = useQuery({
		queryKey: portalPaymentMethodsQueryKey,
		queryFn: () => CustomerPortalApi.getPaymentMethods(),
		enabled: canCheckout,
	});

	// Only a method that can be charged unattended is worth offering here.
	const chargeableMethod = (methods?.providers ?? [])
		.flatMap((group) => group.items)
		.find((method) => method.can_auto_charge && method.status === 'ACTIVE' && method.is_default);

	// Two independent reasons this can be unavailable, and they need different
	// wording: no connected provider can charge off-session, or the customer has
	// no saved card yet. Shown disabled either way rather than hidden, so the
	// option reads as a state to resolve instead of a feature that does not exist.
	const providerCanAutoCharge = supports('auto_charge');
	const savedMethodDisabledReason = !providerCanAutoCharge
		? t('topUp.savedMethodUnsupported')
		: !chargeableMethod
			? t('topUp.savedMethodNone')
			: undefined;

	const { mutate: topUp, isPending } = useMutation({
		mutationFn: async () => {
			// Recorded so an unchanged retry reuses this key while an edited one does not.
			setSubmittedPayload(payloadFingerprint);
			setIdempotencyKey(keyForSubmission);

			const payload: PortalTopUpRequest = {
				credits_to_add: credits,
				idempotency_key: keyForSubmission,
				...(description ? { description } : {}),
				checkout: {
					// Sent explicitly. The resolver only picks for us when exactly one
					// provider has the capability — with two it refuses as ambiguous and
					// ignores is_default entirely. Chosen from /integrations rather than
					// asked of the customer, who should never learn the gateway.
					...(effectiveProvider ? { payment_provider: effectiveProvider } : {}),
					use_saved_method: useSavedMethod && !!chargeableMethod,
					success_url: portalReturnUrl(),
					cancel_url: portalReturnUrl(),
				},
			};
			return CustomerPortalApi.topUpWallet(wallet.id, payload);
		},
		onSuccess: async (response) => {
			const action = response.checkout_session?.payment_action;

			// use_saved_method can settle outright, and some providers vault
			// server-to-server — so an absent action means done, not broken.
			if (action?.url) {
				if (response.checkout_session?.id) rememberPendingCheckout(response.checkout_session.id);
				onActionUrl?.(action.url);
				return;
			}

			// A checkout was requested, so a session with no action to follow means the
			// hand-off is unavailable — reporting success would tell the customer their
			// credits are coming when nothing has been paid.
			if (response.checkout_session && !action?.url) {
				toast.error(t('errors.checkoutUnavailable'));
				return;
			}

			toast.success(t('topUp.successPending'));
			setCredits('');
			setDescription('');
			setIdempotencyKey(crypto.randomUUID());
			setSubmittedPayload(null);
			onDone?.();
			// One call per root: a single array argument is read as one prefix key and
			// would match none of these.
			await refetchPortalQueries(['portal-wallets', 'portal-wallet-balance', 'portal-wallet-transactions', 'portal-invoices-tab']);
		},
		onError: (error: Error) => toast.error(error.message || t('errors.topUp')),
	});

	const parsedCredits = Number(credits);
	const isValid = credits !== '' && Number.isFinite(parsedCredits) && parsedCredits > 0;

	const currencySymbol = getCurrencySymbol(wallet.currency ?? 'USD');
	// topup_conversion_rate, not conversion_rate: the backend prices a top-up with
	// GetCurrencyAmountFromCredits(credits, w.TopupConversionRate), so using the
	// spend rate here would quote an amount the customer is not actually charged.
	const conversionRate = Number(wallet.topup_conversion_rate ?? wallet.conversion_rate ?? 1) || 1;
	const chargeAmount = isValid ? formatMoney(parsedCredits * conversionRate) : null;

	return (
		<div className='flex flex-col gap-4'>
			<Input
				variant='formatted-number'
				label={t('topUp.creditsLabel')}
				placeholder={t('topUp.creditsPlaceholder')}
				value={credits}
				onChange={setCredits}
				disabled={isPending}
				suffix={t('wallet.credits')}
				description={chargeAmount ? <span>{t('topUp.chargeSummary', { amount: `${currencySymbol}${chargeAmount}` })}</span> : undefined}
			/>

			<Input
				label={t('topUp.descriptionLabel')}
				placeholder={t('topUp.descriptionPlaceholder')}
				value={description}
				onChange={setDescription}
				disabled={isPending}
			/>

			{canCheckout && checkoutProviders.length > 1 && (
				<Select
					label={t('topUp.providerLabel')}
					description={t('topUp.providerHint')}
					value={effectiveProvider ?? ''}
					onChange={(value) => setSelectedProvider(value as PaymentGatewayType)}
					options={checkoutProviders.map((p: PaymentGatewayType) => ({ value: p, label: t(`paymentProviders.${p}`) }))}
					disabled={isPending}
				/>
			)}

			{canCheckout && (
				<Toggle
					label={
						chargeableMethod ? t('topUp.useSavedMethod', { method: describeCard(chargeableMethod) }) : t('topUp.useSavedMethodEmptyLabel')
					}
					description={savedMethodDisabledReason ?? t('topUp.useSavedMethodHint')}
					checked={useSavedMethod && !savedMethodDisabledReason}
					onChange={setUseSavedMethod}
					disabled={isPending || !!savedMethodDisabledReason}
				/>
			)}

			<div className='pt-1'>
				<Button
					className='w-full'
					onClick={() => topUp()}
					disabled={!isValid || isPending || !canCheckout}
					isLoading={isPending}
					title={canCheckout ? undefined : t('topUp.checkoutUnavailable')}>
					{t('topUp.payNow')}
				</Button>
				<p className='text-xs text-center mt-2' style={{ color: 'var(--portal-text-secondary, #a1a1aa)' }}>
					{canCheckout ? t('topUp.cardSavedNotice') : t('topUp.checkoutUnavailable')}
				</p>
			</div>
		</div>
	);
};

export default TopUpForm;
