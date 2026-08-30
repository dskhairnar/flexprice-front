import { useQuery } from '@tanstack/react-query';
import CustomerPortalApi from '@/api/CustomerPortalApi';
import { WALLET_STATUS } from '@/models/Wallet';
import { portalWalletsQueryKey } from './queryKeys';

/**
 * Resolves the wallet the billing widgets act on.
 *
 * The portal's other wallet widgets already pick the first active wallet (falling
 * back to the first wallet at all), so top-up, auto top-up and balance stay on the
 * same wallet and share one React Query cache entry.
 */
const usePortalWallet = () => {
	const {
		data: wallets,
		isLoading,
		isError,
	} = useQuery({
		queryKey: portalWalletsQueryKey,
		queryFn: () => CustomerPortalApi.getWallets(),
	});

	const wallet = wallets?.find((w) => w.wallet_status === WALLET_STATUS.ACTIVE) ?? wallets?.[0];

	return { wallet, wallets, isLoading, isError };
};

export default usePortalWallet;
