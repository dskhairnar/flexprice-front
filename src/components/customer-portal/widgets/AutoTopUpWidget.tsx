import { useTranslation } from 'react-i18next';
import { Card } from '@/components/atoms';
import usePortalWallet from '../usePortalWallet';
import EmptyState from '../EmptyState';
import AutoTopUpForm from './AutoTopUpForm';
import useChargeableMethod from '../useChargeableMethod';
import { Wallet } from 'lucide-react';

interface AutoTopUpWidgetProps {
	label?: string;
}

const AutoTopUpWidget = ({ label }: AutoTopUpWidgetProps) => {
	const { hasChargeableMethod } = useChargeableMethod();
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
				<EmptyState icon={<Wallet />} title={t('wallet.emptyTitle')} description={t('wallet.emptyDescription')} />
			</Card>
		);
	}

	// Remounting on a config change re-seeds the form from the saved values.
	const formKey = `${wallet.id}:${JSON.stringify(wallet.auto_topup ?? null)}`;

	return (
		<Card
			className='rounded-xl p-5'
			style={{ backgroundColor: 'var(--portal-surface, white)', border: '1px solid var(--portal-border, #E9E9E9)' }}>
			<h3 className='text-sm font-medium mb-1' style={{ color: 'var(--portal-text-primary, #09090b)' }}>
				{label ?? t('autoTopUp.title')}
			</h3>
			<p className='text-sm mb-4' style={{ color: 'var(--portal-text-secondary, #71717a)' }}>
				{t('autoTopUp.description')}
			</p>
			<AutoTopUpForm key={formKey} wallet={wallet} hasChargeableMethod={hasChargeableMethod} />
		</Card>
	);
};

export default AutoTopUpWidget;
