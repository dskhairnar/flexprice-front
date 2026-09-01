import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import enBilling from '@/i18n/locales/en/billing.json';
import { WALLET_TRANSACTION_REASON } from '@/models/Wallet';
import WalletTransactionsTable from './WalletTransactionsTable';

describe('WalletTransactionsTable', () => {
	it('renders a real translated transaction-reason label through a host i18next instance', () => {
		const instance = createInstance();
		instance.init({ lng: 'en', fallbackLng: 'en', ns: ['billing'], defaultNS: 'billing', resources: { en: { billing: enBilling } } });
		render(
			<I18nextProvider i18n={instance}>
				<WalletTransactionsTable
					data={[
						{
							amount: 100,
							balance_after: 200,
							balance_before: 100,
							created_at: '2026-01-01T00:00:00Z',
							description: '',
							id: 'tx_1',
							metadata: {},
							reference_id: '',
							reference_type: '',
							transaction_status: 'completed',
							type: 'credit',
							wallet_id: 'w1',
							credit_amount: 100,
							transaction_reason: WALLET_TRANSACTION_REASON.FREE_CREDIT_GRANT,
							expiry_date: '',
						},
					]}
				/>
			</I18nextProvider>,
		);
		expect(screen.getByText('Free Credits Added')).toBeInTheDocument();
	});

	it("colors a pending transaction amber (regression test: this table must match CustomerWalletTransactionsTable's coloring)", () => {
		const { container } = render(
			<WalletTransactionsTable
				data={[
					{
						amount: 50,
						balance_after: 150,
						balance_before: 100,
						created_at: '2026-01-01T00:00:00Z',
						description: '',
						id: 'tx_pending',
						metadata: {},
						reference_id: '',
						reference_type: '',
						transaction_status: 'pending',
						type: 'credit',
						wallet_id: 'w1',
						credit_amount: 50,
						transaction_reason: WALLET_TRANSACTION_REASON.FREE_CREDIT_GRANT,
						expiry_date: '',
						currency: 'USD',
					},
				]}
			/>,
		);
		expect(container.querySelector('.text-accent-yellow-brand')).not.toBeNull();
	});

	it('colors a completed credit transaction teal, not amber', () => {
		const { container } = render(
			<WalletTransactionsTable
				data={[
					{
						amount: 50,
						balance_after: 150,
						balance_before: 100,
						created_at: '2026-01-01T00:00:00Z',
						description: '',
						id: 'tx_completed',
						metadata: {},
						reference_id: '',
						reference_type: '',
						transaction_status: 'completed',
						type: 'credit',
						wallet_id: 'w1',
						credit_amount: 50,
						transaction_reason: WALLET_TRANSACTION_REASON.FREE_CREDIT_GRANT,
						expiry_date: '',
						currency: 'USD',
					},
				]}
			/>,
		);
		expect(container.querySelector('.text-accent-yellow-brand')).toBeNull();
		expect(container.querySelector('.text-accent-teal-brand')).not.toBeNull();
	});
});
