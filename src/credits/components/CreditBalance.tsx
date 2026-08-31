// src/credits/components/CreditBalance.tsx
import Card from '@/components/atoms/Card/Card';
import Chip from '@/components/atoms/Chip/Chip';
import { formatCredits, formatMoney } from '@/utils/common/formatBalance';
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
const CreditBalance = ({ wallet: rawWallet, isLoading = false, className, actions }: CreditBalanceProps) => {
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
	// A negative balance means consumption has run past the credits on hand — a state
	// the customer needs named, not left to infer from a minus sign.
	const isOverdrawn = wallet.balance < 0 || wallet.creditBalance < 0;

	return (
		<Card noPadding className={cn('flexprice-ui', 'rounded-xl overflow-hidden bg-surface', className)}>
			<div className='p-5 flex items-start justify-between gap-4'>
				<div className='flex items-center gap-3 min-w-0'>
					<div className='h-9 w-9 rounded-full flex items-center justify-center shrink-0 bg-accent-indigo-muted'>
						<WalletIcon className='h-4 w-4 text-accent-indigo' />
					</div>
					<div className='min-w-0'>
						<h3 className='text-sm font-medium text-content truncate'>{wallet.name || t('creditWidgets.defaultName')}</h3>
						<Chip label={t(`creditWidgets.status.${wallet.status}`)} variant={STATUS_VARIANT[wallet.status] ?? 'default'} />
					</div>
				</div>
				{actions && <div className='shrink-0'>{actions}</div>}
			</div>
			<div className='px-5 pb-5'>
				<span className='text-sm block mb-1 text-content-secondary'>{t('creditWidgets.balance')}</span>
				{/* Money leads: it is the figure a customer can act on. Credits follow as the unit detail.
				    The sign sits outside the currency symbol so a negative reads as -$17,681.62. */}
				<p className={cn('text-3xl font-semibold', isOverdrawn ? 'text-accent-rose' : 'text-content')}>
					{wallet.balance < 0 ? '-' : ''}
					{currencySymbol}
					{formatMoney(Math.abs(wallet.balance))}
				</p>
				<p className='text-sm mt-1 text-content-secondary'>
					{formatCredits(wallet.creditBalance)} {t('creditWidgets.credits')}
				</p>
				{isOverdrawn && <p className='text-sm mt-3 text-accent-rose'>{t('creditWidgets.overdrawnHint')}</p>}
			</div>
		</Card>
	);
};

export default CreditBalance;
