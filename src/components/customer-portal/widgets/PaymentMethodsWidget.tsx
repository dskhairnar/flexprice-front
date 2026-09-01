import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { AlertTriangle, CreditCard, Plus, Trash2 } from 'lucide-react';
import CustomerPortalApi from '@/api/CustomerPortalApi';
import { Button, Card, Chip, Dialog } from '@/components/atoms';
import { refetchPortalQueries } from '../refetchPortalQueries';
import type { PaymentGatewayType, ProviderSavedPaymentMethods, SavedPaymentMethod } from '@/types/dto/CustomerPortalBilling';
import { portalPaymentMethodsQueryKey } from '../queryKeys';
import usePortalIntegrations from '../usePortalIntegrations';
import { navigateToPaymentUrl } from '@/utils/common/openPaymentUrl';
import EmptyState from '../EmptyState';

interface PaymentMethodsWidgetProps {
	label?: string;
}

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
				{method.is_default ? (
					<Chip label={t('paymentMethods.default')} variant='success' />
				) : (
					canSetDefault &&
					!isExpired && (
						<Button variant='ghost' size='xs' onClick={() => onSetDefault(method)} disabled={isBusy}>
							{t('paymentMethods.setDefault')}
						</Button>
					)
				)}
				<Button
					variant='ghost'
					size='xs'
					onClick={() => onDelete(method)}
					disabled={isBusy}
					aria-label={t('paymentMethods.remove')}
					title={t('paymentMethods.remove')}>
					<Trash2 className='h-4 w-4' />
				</Button>
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
				success_url: window.location.href,
				cancel_url: window.location.href,
			}),
		onSuccess: async (response) => {
			// A provider that vaults server-to-server returns type 'none' — there is
			// nothing to redirect to, so refresh instead of waiting for a return trip.
			if (response.action.type === 'redirect' && response.action.url) {
				// Refused rather than followed when the scheme is not http(s): the URL is
				// an unconstrained API string and a javascript: URL would execute.
				if (!navigateToPaymentUrl(response.action.url)) {
					toast.error(t('errors.addPaymentMethod'));
				}
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
		onSuccess: async () => {
			toast.success(t('paymentMethods.defaultUpdated'));
			await refetchPortalQueries(['portal-payment-methods']);
		},
		onError: (error: Error) => toast.error(error.message || t('errors.setDefaultPaymentMethod')),
	});

	const { mutate: deleteMethod, isPending: isDeleting } = useMutation({
		mutationFn: (method: SavedPaymentMethod) =>
			CustomerPortalApi.deletePaymentMethod({ payment_provider: method.provider, payment_method_id: method.id }),
		onSuccess: async () => {
			toast.success(t('paymentMethods.removed'));
			setPendingDelete(null);
			await refetchPortalQueries(['portal-payment-methods']);
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
				<EmptyState title={t('paymentMethods.providerUnavailable')} description={t('paymentMethods.retryHint')} />
			</Card>
		);
	}

	if (!integrationsLoading && !canManage) {
		return (
			<Card className='rounded-xl p-6' style={cardStyle}>
				<EmptyState title={t('paymentMethods.unsupportedTitle')} description={t('paymentMethods.unsupportedDescription')} />
			</Card>
		);
	}

	return (
		<Card className='rounded-xl p-5' style={cardStyle}>
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
				<EmptyState title={t('errors.loadPaymentMethods')} description={t('paymentMethods.retryHint')} />
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
				<EmptyState title={t('paymentMethods.emptyTitle')} description={t('paymentMethods.emptyDescription')} />
			)}
		</Card>
	);
};

export default PaymentMethodsWidget;
