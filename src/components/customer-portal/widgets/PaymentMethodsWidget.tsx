import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { AlertTriangle, CreditCard, MoreHorizontal, Plus, Star, Trash2 } from 'lucide-react';
import CustomerPortalApi from '@/api/CustomerPortalApi';
import { portalReturnUrl } from '../portalReturnUrl';
import { Button, Card, Chip, Dialog } from '@/components/atoms';
import { DropdownMenu } from '@/components/molecules';
import { refetchPortalQueries } from '../refetchPortalQueries';
import type { PaymentGatewayType, ProviderSavedPaymentMethods, SavedPaymentMethod } from '@/types/dto/CustomerPortalBilling';
import { portalPaymentMethodsQueryKey } from '../queryKeys';
import usePortalIntegrations from '../usePortalIntegrations';
import { openPaymentUrl } from '@/utils/common/openPaymentUrl';
import CheckoutLinkDialog from './CheckoutLinkDialog';
import EmptyState from '../EmptyState';

interface PaymentMethodsWidgetProps {
	label?: string;
}

/** Names a method for an accessible label without leaking the gateway. */
const describeMethod = (method: SavedPaymentMethod, t: (k: string, o?: Record<string, unknown>) => string) =>
	method.card?.last4 ? t('paymentMethods.cardLabel', { brand: method.card.brand ?? 'card', last4: method.card.last4 }) : method.id;

const formatExpiry = (month?: number, year?: number) => {
	if (!month || !year) return null;
	return `${String(month).padStart(2, '0')}/${String(year).slice(-2)}`;
};

interface MethodRowProps {
	method: SavedPaymentMethod;
	canSetDefault: boolean;
	onSetDefault: (method: SavedPaymentMethod) => void;
	onDelete: (method: SavedPaymentMethod) => void;
	isBusy: boolean;
}

const MethodRow = ({ method, canSetDefault, onSetDefault, onDelete, isBusy }: MethodRowProps) => {
	const { t } = useTranslation('customer-portal');
	const expiry = formatExpiry(method.card?.exp_month, method.card?.exp_year);
	const isExpired = method.status === 'EXPIRED';

	return (
		<div className='flex items-center justify-between gap-4 py-3.5'>
			<div className='flex items-center gap-3 min-w-0'>
				<div
					className='h-9 w-9 rounded-full flex items-center justify-center shrink-0'
					style={{ backgroundColor: 'var(--portal-bg, #eff6ff)' }}>
					<CreditCard className='h-4 w-4' style={{ color: 'var(--portal-primary, #2563eb)' }} />
				</div>
				<div className='min-w-0'>
					<p className='text-sm font-medium truncate' style={{ color: 'var(--portal-text-primary, #09090b)' }}>
						{method.card?.last4
							? t('paymentMethods.cardLabel', { brand: method.card.brand ?? 'card', last4: method.card.last4 })
							: method.id}
					</p>
					<div className='flex items-center gap-2 mt-0.5'>
						{expiry && (
							<span className='text-xs' style={{ color: 'var(--portal-text-secondary, #71717a)' }}>
								{t('paymentMethods.expires', { expiry })}
							</span>
						)}
						{isExpired && <Chip label={t('paymentMethods.expired')} variant='failed' />}
					</div>
				</div>
			</div>

			<div className='flex items-center gap-2 shrink-0'>
				{method.is_default && <Chip label={t('paymentMethods.default')} variant='success' />}
				{/* One menu rather than inline buttons, matching the admin row actions and
				    the invoices table: the set of actions varies per method, and inline
				    controls made each row a different width. */}
				<DropdownMenu
					align='end'
					trigger={
						<button
							type='button'
							aria-label={t('paymentMethods.rowActions', { method: describeMethod(method, t) })}
							className='p-1.5 rounded-md transition-colors'
							style={{ color: 'var(--portal-text-secondary, #71717a)' }}>
							<MoreHorizontal className='h-4 w-4' />
						</button>
					}
					options={[
						{
							label: t('paymentMethods.setDefault'),
							icon: <Star className='w-4 h-4' />,
							disabled: method.is_default || !canSetDefault || isExpired || isBusy,
							disabledReason: method.is_default
								? t('paymentMethods.alreadyDefault')
								: !canSetDefault
									? t('paymentMethods.setDefaultUnsupported')
									: isExpired
										? t('paymentMethods.expiredCannotDefault')
										: undefined,
							onSelect: () => onSetDefault(method),
						},
						{
							label: t('paymentMethods.remove'),
							icon: <Trash2 className='w-4 h-4' />,
							disabled: isBusy,
							onSelect: () => onDelete(method),
						},
					]}
				/>
			</div>
		</div>
	);
};

/** A provider that could not be read is not the same as one with no cards. */
const ProviderGroup = ({ group, children }: { group: ProviderSavedPaymentMethods; children: React.ReactNode }) => {
	const { t } = useTranslation('customer-portal');

	if (group.error) {
		return (
			<div className='py-3.5 flex items-start gap-2'>
				<AlertTriangle className='h-4 w-4 mt-0.5 shrink-0' style={{ color: 'rgb(var(--fp-danger))' }} />
				<div>
					<p className='text-sm' style={{ color: 'var(--portal-text-primary, #09090b)' }}>
						{t('paymentMethods.providerUnavailable')}
					</p>
					<p className='text-xs mt-0.5' style={{ color: 'var(--portal-text-secondary, #71717a)' }}>
						{group.error.message}
					</p>
				</div>
			</div>
		);
	}

	return <>{children}</>;
};

/**
 * Saved payment methods, grouped by provider.
 *
 * Gateway names are never shown — the portal reads as Flexprice handling payments
 * regardless of what is behind it — but methods stay grouped because defaults and
 * deletes are scoped per provider, so both operations need to carry one.
 */
const PaymentMethodsWidget = ({ label }: PaymentMethodsWidgetProps) => {
	const { t } = useTranslation('customer-portal');
	const {
		supports,
		providersFor,
		defaultProviderFor,
		isLoading: integrationsLoading,
		isError: integrationsError,
	} = usePortalIntegrations();
	const [pendingDelete, setPendingDelete] = useState<SavedPaymentMethod | null>(null);
	const [setupUrl, setSetupUrl] = useState<string | null>(null);
	const queryClient = useQueryClient();

	const canManage = supports('payment_method_management');
	// Capability is per provider: in a mixed-provider portal a global flag would
	// offer Set as default on a provider that cannot do it, and the call would fail.
	const setDefaultProviders = providersFor('set_default_method');

	const { data, isLoading, isError } = useQuery({
		queryKey: portalPaymentMethodsQueryKey,
		queryFn: () => CustomerPortalApi.getPaymentMethods(),
		enabled: canManage,
	});

	const { mutate: addMethod, isPending: isAdding } = useMutation({
		mutationFn: (provider: PaymentGatewayType) =>
			CustomerPortalApi.addPaymentMethod({
				payment_provider: provider,
				success_url: portalReturnUrl(),
				cancel_url: portalReturnUrl(),
			}),
		onSuccess: async (response) => {
			// A provider that vaults server-to-server returns type 'none' — there is
			// nothing to redirect to, so refresh instead of waiting for a return trip.
			if (response.action.type === 'redirect' && response.action.url) {
				// A new tab, not this one: navigating away would unmount the portal, so a
				// customer who abandons the provider's page has nothing to come back to.
				// The link is shown as well, because the open runs in an async callback
				// rather than the click and a popup blocker can stop it. Both paths refuse
				// a non-http(s) scheme — the URL is an unconstrained API string.
				setSetupUrl(response.action.url);
				openPaymentUrl(response.action.url);
				return;
			}
			toast.success(t('paymentMethods.added'));
			await refetchPortalQueries(['portal-payment-methods']);
		},
		onError: (error: Error) => toast.error(error.message || t('errors.addPaymentMethod')),
	});

	const { mutate: setDefault, isPending: isSettingDefault } = useMutation({
		mutationFn: (method: SavedPaymentMethod) =>
			CustomerPortalApi.setDefaultPaymentMethod({ payment_provider: method.provider, payment_method_id: method.id }),
		onSuccess: (updated) => {
			toast.success(t('paymentMethods.defaultUpdated'));
			// The response is the gateway re-read after the write, so refetching here
			// would only ask the same question twice.
			queryClient.setQueryData(portalPaymentMethodsQueryKey, updated);
		},
		onError: (error: Error) => toast.error(error.message || t('errors.setDefaultPaymentMethod')),
	});

	const { mutate: deleteMethod, isPending: isDeleting } = useMutation({
		mutationFn: (method: SavedPaymentMethod) =>
			CustomerPortalApi.deletePaymentMethod({ payment_provider: method.provider, payment_method_id: method.id }),
		onSuccess: (updated) => {
			toast.success(t('paymentMethods.removed'));
			setPendingDelete(null);
			queryClient.setQueryData(portalPaymentMethodsQueryKey, updated);
		},
		onError: (error: Error) => toast.error(error.message || t('errors.deletePaymentMethod')),
	});

	const groups = data?.providers ?? [];
	const hasAnyMethod = groups.some((group) => group.items.length > 0);
	const isBusy = isSettingDefault || isDeleting;
	const addProvider = defaultProviderFor('payment_method_management');

	const cardStyle = { backgroundColor: 'var(--portal-surface, white)', border: '1px solid var(--portal-border, #E9E9E9)' };

	// An integrations failure is not the same as a provider that cannot manage
	// methods — saying "not available" would state something we do not know.
	if (integrationsError) {
		return (
			<Card className='rounded-xl p-6' style={cardStyle}>
				<EmptyState icon={<AlertTriangle />} title={t('paymentMethods.providerUnavailable')} description={t('paymentMethods.retryHint')} />
			</Card>
		);
	}

	if (!integrationsLoading && !canManage) {
		return (
			<Card className='rounded-xl p-6' style={cardStyle}>
				<EmptyState
					icon={<CreditCard />}
					title={t('paymentMethods.unsupportedTitle')}
					description={t('paymentMethods.unsupportedDescription')}
				/>
			</Card>
		);
	}

	return (
		<Card className='rounded-xl p-5' style={cardStyle}>
			<CheckoutLinkDialog url={setupUrl} purpose='setup' onOpenChange={(open) => !open && setSetupUrl(null)} />
			<Dialog
				isOpen={pendingDelete !== null}
				onOpenChange={(open) => !open && setPendingDelete(null)}
				title={t('paymentMethods.removeTitle')}
				description={t('paymentMethods.removeConfirm')}>
				<div className='flex justify-end gap-2'>
					<Button variant='outline' onClick={() => setPendingDelete(null)} disabled={isDeleting}>
						{t('paymentMethods.cancel')}
					</Button>
					<Button variant='destructive' onClick={() => pendingDelete && deleteMethod(pendingDelete)} isLoading={isDeleting}>
						{t('paymentMethods.remove')}
					</Button>
				</div>
			</Dialog>

			<div className='flex items-start justify-between gap-4 mb-4'>
				<div>
					<h3 className='text-sm font-medium mb-0.5' style={{ color: 'var(--portal-text-primary, #09090b)' }}>
						{label ?? t('paymentMethods.title')}
					</h3>
					<p className='text-sm' style={{ color: 'var(--portal-text-secondary, #71717a)' }}>
						{t('paymentMethods.description')}
					</p>
				</div>
				{addProvider && (
					<Button size='sm' onClick={() => addMethod(addProvider)} isLoading={isAdding} prefixIcon={<Plus />} className='shrink-0'>
						{t('paymentMethods.add')}
					</Button>
				)}
			</div>

			{isLoading || integrationsLoading ? (
				<div className='animate-pulse space-y-3'>
					{[1, 2].map((i) => (
						<div key={i} className='h-12 bg-zinc-100 rounded'></div>
					))}
				</div>
			) : isError ? (
				<EmptyState icon={<AlertTriangle />} title={t('errors.loadPaymentMethods')} description={t('paymentMethods.retryHint')} />
			) : hasAnyMethod || groups.some((g) => g.error) ? (
				<div className='divide-y' style={{ borderColor: 'var(--portal-border, #E9E9E9)' }}>
					{groups.map((group) => (
						<ProviderGroup key={group.provider} group={group}>
							{group.items.map((method) => (
								<MethodRow
									key={`${group.provider}:${method.id}`}
									method={method}
									canSetDefault={setDefaultProviders.includes(group.provider)}
									onSetDefault={setDefault}
									onDelete={setPendingDelete}
									isBusy={isBusy}
								/>
							))}
						</ProviderGroup>
					))}
				</div>
			) : (
				<EmptyState icon={<CreditCard />} title={t('paymentMethods.emptyTitle')} description={t('paymentMethods.emptyDescription')} />
			)}
		</Card>
	);
};

export default PaymentMethodsWidget;
