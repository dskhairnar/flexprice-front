import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';

/**
 * Refetch several unrelated query keys.
 *
 * `refetchQueries` passes its argument straight through as a single `queryKey`,
 * which React Query treats as one prefix — so `['portal-wallets',
 * 'portal-wallet-balance']` matches a query whose key *starts with both*, and
 * therefore matches neither `['portal-wallets']` nor
 * `['portal-wallet-balance', id]`. Passing a list of distinct roots silently
 * refreshed nothing. Each root has to be its own call.
 */
export const refetchPortalQueries = async (keys: string[]) => {
	await Promise.all(keys.map((key) => refetchQueries(key)));
};
