import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { Button, Dialog } from '@/components/atoms';
import usePortalWallet from '../usePortalWallet';
import TopUpForm from './TopUpForm';

interface TopUpButtonProps {
	size?: 'default' | 'sm' | 'xs';
}

/**
 * Primary Top-up action, opened as a dialog rather than occupying a card of its own.
 * Renders nothing when the customer has no wallet to top up.
 */
const TopUpButton = ({ size = 'sm' }: TopUpButtonProps) => {
	const { t } = useTranslation('customer-portal');
	const { wallet, isLoading } = usePortalWallet();
	const [isOpen, setIsOpen] = useState(false);

	if (isLoading || !wallet) return null;

	return (
		<>
			<Button size={size} onClick={() => setIsOpen(true)} prefixIcon={<Plus />}>
				{t('topUp.title')}
			</Button>
			<Dialog isOpen={isOpen} onOpenChange={setIsOpen} title={t('topUp.title')} description={t('topUp.description')}>
				<TopUpForm wallet={wallet} onDone={() => setIsOpen(false)} />
			</Dialog>
		</>
	);
};

export default TopUpButton;
