// src/credits/components/CreditBalance.tsx
import Card from '@/components/atoms/Card/Card';
import Chip from '@/components/atoms/Chip/Chip';
import { formatAmount } from '@/components/atoms/Input/Input';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { Wallet as WalletIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCreditsT } from '../i18n';
import { normalizeCreditBalanceData } from '../schema';
import type { CreditBalanceProps } from '../types';

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'failed' | 'default'> = {
	active: 'success',
	frozen: 'warning',
	closed: 'failed',
};

/**
 * Prop-only wallet-balance card — no fetching, no auth, no PortalConfigContext. Consumers supply
 * an already-adapted `wallet` (see `adaptCreditBalance`), or `null` for the empty state.
 */
const CreditBalance = ({ wallet: rawWallet, isLoading = false, className }: CreditBalanceProps) => {
	const wallet = rawWallet ? normalizeCreditBalanceData(rawWallet) : null;
	const t = useCreditsT();

	if (isLoading) {
		return (
			<Card noPadding className={cn('flexprice-ui', 'rounded-xl overflow-hidden bg-surface', className)}>
				<div className='p-6 border-b border-line'>
					<div className='h-5 w-32 bg-surface-muted animate-pulse rounded' />
				</div>
				<div className='p-6'>
					<div className='animate-pulse space-y-3'>
						<div className='h-4 bg-surface-muted rounded w-20' />
						<div className='h-10 bg-surface-muted rounded w-32' />
					</div>
				</div>
			</Card>
		);
	}

	if (!wallet) {
		return (
			<Card noPadding className={cn('flexprice-ui', 'rounded-xl p-6 bg-surface', className)}>
				<div className='flex flex-col items-center justify-center py-16 px-4'>
					<p className='text-sm font-medium text-content-secondary mb-1'>{t('creditWidgets.emptyTitle')}</p>
					<p className='text-xs text-content-muted text-center max-w-sm mt-1'>{t('creditWidgets.emptyDescription')}</p>
				</div>
			</Card>
		);
	}

	const currencySymbol = getCurrencySymbol(wallet.currency);

	return (
		<Card noPadding className={cn('flexprice-ui', 'rounded-xl overflow-hidden bg-surface', className)}>
			<div className='p-6 border-b border-line'>
				<div className='flex items-center gap-3'>
					<div className='h-10 w-10 rounded-full flex items-center justify-center bg-accent-indigo-muted'>
						<WalletIcon className='h-5 w-5 text-accent-indigo' />
					</div>
					<div>
						<h3 className='text-base font-medium text-content'>{wallet.name || t('creditWidgets.defaultName')}</h3>
						<Chip label={t(`creditWidgets.status.${wallet.status}`)} variant={STATUS_VARIANT[wallet.status] ?? 'default'} />
					</div>
				</div>
			</div>
			<div className='p-6'>
				<span className='text-sm block mb-2 text-content-secondary'>{t('creditWidgets.balance')}</span>
				<div className='flex items-baseline gap-2'>
					<span className='text-4xl font-semibold text-content'>{formatAmount(wallet.creditBalance.toString())}</span>
					<span className='text-base font-normal text-content-secondary'>{t('creditWidgets.credits')}</span>
				</div>
				<p className='text-sm mt-1 text-content-secondary'>
					{currencySymbol}
					{formatAmount(wallet.balance.toString())} {t('creditWidgets.valueSuffix')}
				</p>
			</div>
		</Card>
	);
};

export default CreditBalance;
