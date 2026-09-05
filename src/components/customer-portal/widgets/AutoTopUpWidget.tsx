import { useTranslation } from 'react-i18next';
import { Card } from '@/components/atoms';
import usePortalWallet from '../usePortalWallet';
import EmptyState from '../EmptyState';
import AutoTopUpForm from './AutoTopUpForm';
import useChargeableMethod from '../useChargeableMethod';
import { Wallet } from 'lucide-react';
import PortalSkeleton from '@/components/atoms/PortalSkeleton/PortalSkeleton';

interface AutoTopUpWidgetProps {
	label?: string;
}

const AutoTopUpWidget = ({ label }: AutoTopUpWidgetProps) => {
	const { hasChargeableMethod } = useChargeableMethod();
	const { t } = useTranslation('customer-portal');
	const { wallet, isLoading } = usePortalWallet();

	if (isLoading) {
		return (
			<Card className='rounded-xl p-5 bg-surface border border-line'>
				<div className='space-y-3'>
					<PortalSkeleton className='h-4 w-32' />
					<PortalSkeleton className='h-8 w-full' />
				</div>
			</Card>
		);
	}

	if (!wallet) {
		return (
			<Card className='rounded-xl p-5 bg-surface border border-line'>
				<EmptyState icon={<Wallet />} title={t('wallet.emptyTitle')} description={t('wallet.emptyDescription')} />
			</Card>
		);
	}

	// Remounting on a config change re-seeds the form from the saved values.
	const formKey = `${wallet.id}:${JSON.stringify(wallet.auto_topup ?? null)}`;

	return (
		<Card className='rounded-xl p-5 bg-surface border border-line'>
			<h3 className='text-sm font-medium mb-1 text-content'>{label ?? t('autoTopUp.title')}</h3>
			<p className='text-sm mb-4 text-content-secondary'>{t('autoTopUp.description')}</p>
			<AutoTopUpForm key={formKey} wallet={wallet} hasChargeableMethod={hasChargeableMethod} />
		</Card>
	);
};

export default AutoTopUpWidget;
