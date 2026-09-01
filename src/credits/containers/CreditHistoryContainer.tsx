// src/credits/containers/CreditHistoryContainer.tsx
//
// Dashboard-only data-fetching wrapper. NOT exported from the package — see `CreditHistory`.
// Owns `usePagination()` (router-coupled) and translates its output into the fully controlled
// `page`/`pageSize`/`totalItems`/`onPageChange` props the exported `CreditHistory` expects.
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import CustomerPortalApi from '@/api/CustomerPortalApi';
import { WALLET_STATUS } from '@/models/Wallet';
import usePagination, { PAGINATION_PREFIX } from '@/hooks/usePagination';
import { adaptCreditTransactions, adaptWalletOptions } from '../adapters';
import CreditHistory from '../components/CreditHistory';

interface CreditHistoryContainerProps {
	className?: string;
}

const CreditHistoryContainer = ({ className }: CreditHistoryContainerProps) => {
	const { t } = useTranslation('customer-portal');
	const { page, setPage, limit, offset, reset: resetPage } = usePagination({ prefix: PAGINATION_PREFIX.WALLET_TRANSACTIONS });
	const [selectedWalletId, setSelectedWalletId] = useState<string>('');

	// A page number valid for the previous wallet can be out of range (or just wrong) for the
	// newly selected one — its transaction list has its own, independent total.
	const handleSelectWallet = (walletId: string) => {
		setSelectedWalletId(walletId);
		resetPage();
	};

	const {
		data: wallets,
		isLoading: walletsLoading,
		isError: walletsError,
	} = useQuery({
		queryKey: ['portal-wallets'],
		queryFn: () => CustomerPortalApi.getWallets(),
	});

	const activeWallet = selectedWalletId
		? wallets?.find((w) => w.id === selectedWalletId)
		: wallets?.find((w) => w.wallet_status === WALLET_STATUS.ACTIVE) || wallets?.[0];

	const {
		data: transactionsData,
		isLoading: transactionsLoading,
		isError: transactionsError,
	} = useQuery({
		queryKey: ['portal-wallet-transactions', activeWallet?.id, limit, offset],
		queryFn: () => CustomerPortalApi.getWalletTransactions({ walletId: activeWallet!.id, limit, offset }),
		enabled: !!activeWallet?.id,
	});

	useEffect(() => {
		if (walletsError) toast.error(t('errors.loadWallets'));
	}, [walletsError, t]);
	useEffect(() => {
		if (transactionsError) toast.error(t('errors.loadTransactions'));
	}, [transactionsError, t]);

	const isLoading = walletsLoading || (!!activeWallet?.id && transactionsLoading);
	const transactions = adaptCreditTransactions(transactionsData?.items ?? []);
	const walletOptions = adaptWalletOptions(wallets ?? []);

	return (
		<CreditHistory
			transactions={transactions}
			wallets={walletOptions}
			selectedWalletId={activeWallet?.id}
			onSelectWallet={handleSelectWallet}
			page={page}
			pageSize={limit}
			totalItems={transactionsData?.pagination?.total ?? 0}
			onPageChange={setPage}
			isLoading={isLoading}
			className={className}
		/>
	);
};

export default CreditHistoryContainer;
