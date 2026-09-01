import { describe, it, expect } from 'vitest';
import { QueryClient } from '@tanstack/react-query';

/**
 * Documents why refetchPortalQueries exists. `refetchQueries` forwards its
 * argument as a single queryKey, and React Query treats that as one prefix.
 */
describe('multi-key refetch', () => {
	it('a list of distinct roots matches nothing as one prefix', () => {
		const qc = new QueryClient();
		qc.setQueryData(['portal-wallets'], 'a');
		qc.setQueryData(['portal-wallet-balance', 'w1'], 'b');

		const asOnePrefix = qc.getQueryCache().findAll({ queryKey: ['portal-wallets', 'portal-wallet-balance'], exact: false });

		expect(asOnePrefix).toHaveLength(0);
	});

	it('matches both when each root is queried separately', () => {
		const qc = new QueryClient();
		qc.setQueryData(['portal-wallets'], 'a');
		qc.setQueryData(['portal-wallet-balance', 'w1'], 'b');

		const matched = ['portal-wallets', 'portal-wallet-balance'].flatMap((key) =>
			qc.getQueryCache().findAll({ queryKey: [key], exact: false }),
		);

		expect(matched).toHaveLength(2);
	});
});
