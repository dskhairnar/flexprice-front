import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import CustomerPortalApi from '@/api/CustomerPortalApi';
import { Button, Card, Input } from '@/components/atoms';
import { Label, Switch } from '@/components/ui';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { formatMoney } from '@/utils/common/formatBalance';
import { WalletResponse } from '@/types/dto/Wallet';
import usePortalWallet from '../usePortalWallet';
import EmptyState from '../EmptyState';

interface AutoTopUpWidgetProps {
	label?: string;
}

interface AutoTopUpFormProps {
	wallet: WalletResponse;
	label?: string;
}

/**
 * Auto top-up configuration form.
 *
 * Split out from the fetching wrapper so its state seeds straight from the wallet
 * on mount; the wrapper remounts it (via `key`) when the stored config changes,
 * which keeps the fields in sync without a state-syncing effect.
 *
 * Threshold and amount are required by the API on every save, so the form keeps
 * them populated while toggled off rather than clearing the stored config.
 */
const AutoTopUpForm = ({ wallet, label }: AutoTopUpFormProps) => {
	const { t } = useTranslation('customer-portal');

	const configured = wallet.auto_topup?.enabled ?? false;
	// Start collapsed when there is a saved config to summarise; open straight into
	// the fields when there is nothing to show yet.
	const [isEditing, setIsEditing] = useState(!configured);
	const [enabled, setEnabled] = useState(wallet.auto_topup?.enabled ?? false);
	const [threshold, setThreshold] = useState(wallet.auto_topup?.threshold ?? '');
	const [amount, setAmount] = useState(wallet.auto_topup?.amount ?? '');

	const { mutate: save, isPending } = useMutation({
		mutationFn: () =>
			CustomerPortalApi.updateAutoTopup(wallet.id, {
				auto_topup: {
					enabled,
					threshold,
					amount,
					// Auto top-ups from the portal are invoiced, matching the
					// purchased-credit reason the backend pins on the top-up itself.
					invoicing: true,
				},
			}),
		onSuccess: async () => {
			toast.success(t('autoTopUp.saved'));
			setIsEditing(false);
			await refetchQueries(['portal-wallets', 'portal-wallet-balance']);
		},
		onError: () => toast.error(t('errors.saveAutoTopUp')),
	});

	const currencySymbol = getCurrencySymbol(wallet.currency ?? 'USD');
	// Both values are required by the API whenever auto top-up is on.
	const isValid = !enabled || (Number(threshold) > 0 && Number(amount) > 0);

	const summary = t('autoTopUp.summary', {
		amount: `${currencySymbol}${formatMoney(wallet.auto_topup?.amount)}`,
		threshold: `${currencySymbol}${formatMoney(wallet.auto_topup?.threshold)}`,
	});

	// Collapsed: one plain-language line plus the action that changes it.
	if (!isEditing) {
		return (
			<Card
				className='rounded-xl p-5'
				style={{ backgroundColor: 'var(--portal-surface, white)', border: '1px solid var(--portal-border, #E9E9E9)' }}>
				<div className='flex items-center justify-between gap-4'>
					<div className='min-w-0'>
						<h3 className='text-sm font-medium mb-0.5' style={{ color: 'var(--portal-text-primary, #09090b)' }}>
							{label ?? t('autoTopUp.title')}
						</h3>
						<p className='text-sm' style={{ color: 'var(--portal-text-secondary, #71717a)' }}>
							{configured ? summary : t('autoTopUp.offSummary')}
						</p>
					</div>
					<Button variant='outline' size='sm' onClick={() => setIsEditing(true)} className='shrink-0'>
						{configured ? t('autoTopUp.manage') : t('autoTopUp.enable')}
					</Button>
				</div>
			</Card>
		);
	}

	return (
		<Card
			className='rounded-xl p-5'
			style={{ backgroundColor: 'var(--portal-surface, white)', border: '1px solid var(--portal-border, #E9E9E9)' }}>
			<div className='flex items-start justify-between gap-4 mb-5'>
				<div>
					<h3 className='text-sm font-medium mb-0.5' style={{ color: 'var(--portal-text-primary, #09090b)' }}>
						{label ?? t('autoTopUp.title')}
					</h3>
					<p className='text-sm' style={{ color: 'var(--portal-text-secondary, #71717a)' }}>
						{t('autoTopUp.description')}
					</p>
				</div>
				<div className='flex items-center gap-2 shrink-0'>
					<Switch id='portal-auto-topup' checked={enabled} onCheckedChange={setEnabled} disabled={isPending} />
					<Label htmlFor='portal-auto-topup' className='text-sm'>
						{enabled ? t('autoTopUp.on') : t('autoTopUp.off')}
					</Label>
				</div>
			</div>

			{enabled && (
				<div className='grid gap-4 sm:grid-cols-2 mb-5'>
					<Input
						label={t('autoTopUp.thresholdLabel')}
						description={t('autoTopUp.thresholdHelp')}
						type='number'
						value={threshold}
						onChange={setThreshold}
						disabled={isPending}
						inputPrefix={currencySymbol}
					/>
					<Input
						label={t('autoTopUp.amountLabel')}
						description={t('autoTopUp.amountHelp')}
						type='number'
						value={amount}
						onChange={setAmount}
						disabled={isPending}
						inputPrefix={currencySymbol}
					/>
				</div>
			)}

			<div className='flex items-center gap-2'>
				<Button onClick={() => save()} disabled={!isValid || isPending} isLoading={isPending}>
					{t('autoTopUp.save')}
				</Button>
				{configured && (
					<Button variant='ghost' onClick={() => setIsEditing(false)} disabled={isPending}>
						{t('autoTopUp.cancel')}
					</Button>
				)}
			</div>
		</Card>
	);
};

const AutoTopUpWidget = ({ label }: AutoTopUpWidgetProps) => {
	const { t } = useTranslation('customer-portal');
	const { wallet, isLoading } = usePortalWallet();

	if (isLoading) {
		return (
			<Card
				className='rounded-xl p-5'
				style={{ backgroundColor: 'var(--portal-surface, white)', border: '1px solid var(--portal-border, #E9E9E9)' }}>
				<div className='animate-pulse space-y-3'>
					<div className='h-4 bg-zinc-100 rounded w-32'></div>
					<div className='h-8 bg-zinc-100 rounded w-full'></div>
				</div>
			</Card>
		);
	}

	if (!wallet) {
		return (
			<Card
				className='rounded-xl p-5'
				style={{ backgroundColor: 'var(--portal-surface, white)', border: '1px solid var(--portal-border, #E9E9E9)' }}>
				<EmptyState title={t('wallet.emptyTitle')} description={t('wallet.emptyDescription')} />
			</Card>
		);
	}

	// Remounting on a config change re-seeds the form from the saved values.
	const formKey = `${wallet.id}:${JSON.stringify(wallet.auto_topup ?? null)}`;

	return <AutoTopUpForm key={formKey} wallet={wallet} label={label} />;
};

export default AutoTopUpWidget;
