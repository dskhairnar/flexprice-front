import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings2 } from 'lucide-react';
import { Dialog } from '@/components/atoms';
import { DropdownMenu } from '@/components/molecules';
import { WalletResponse } from '@/types/dto/Wallet';
import TopUpButton from './TopUpButton';
import AutoTopUpForm from './AutoTopUpForm';
import useChargeableMethod from '../useChargeableMethod';

interface WalletActionsProps {
	wallet: WalletResponse;
}

/**
 * Wallet header actions: Top up as the primary button, and a menu for the rest.
 *
 * The admin wallet menu also carries Create Wallet, Alert Settings, Manual Debit
 * and Terminate. None of those belong to a customer, so the portal menu exposes
 * auto top-up configuration only.
 */
const WalletActions = ({ wallet }: WalletActionsProps) => {
	const { hasChargeableMethod } = useChargeableMethod();
	const { t } = useTranslation('customer-portal');
	const [isAutoTopUpOpen, setIsAutoTopUpOpen] = useState(false);

	return (
		<div className='flex items-center gap-2'>
			<TopUpButton />
			<DropdownMenu
				options={[
					{
						label: t('autoTopUp.title'),
						icon: <Settings2 className='h-4 w-4' />,
						onSelect: () => setIsAutoTopUpOpen(true),
					},
				]}
			/>
			<Dialog
				isOpen={isAutoTopUpOpen}
				onOpenChange={setIsAutoTopUpOpen}
				title={t('autoTopUp.title')}
				description={t('autoTopUp.description')}>
				<AutoTopUpForm wallet={wallet} hasChargeableMethod={hasChargeableMethod} onDone={() => setIsAutoTopUpOpen(false)} />
			</Dialog>
		</div>
	);
};

export default WalletActions;
