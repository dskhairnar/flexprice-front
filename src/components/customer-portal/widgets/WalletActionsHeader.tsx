import usePortalWallet from '../usePortalWallet';
import WalletActions from './WalletActions';

/** Resolves the portal wallet so WalletActions stays prop-only. */
const WalletActionsHeader = () => {
	const { wallet, isLoading } = usePortalWallet();
	if (isLoading || !wallet) return null;
	return <WalletActions wallet={wallet} />;
};

export default WalletActionsHeader;
