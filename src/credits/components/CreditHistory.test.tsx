import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import CreditHistory from './CreditHistory';

const TRANSACTIONS = [
	{ id: 't1', type: 'credit' as const, amount: 100, creditAmount: 100, reason: 'FREE_CREDIT_GRANT', createdAt: '2026-01-01T00:00:00Z' },
];

describe('CreditHistory', () => {
	it('renders the transaction history title and table', () => {
		render(<CreditHistory transactions={TRANSACTIONS} page={1} pageSize={10} totalItems={1} onPageChange={vi.fn()} />);
		expect(screen.getByText('Transaction History')).toBeInTheDocument();
	});

	it('renders the empty state when there are no transactions', () => {
		render(<CreditHistory transactions={[]} page={1} pageSize={10} totalItems={0} onPageChange={vi.fn()} />);
		expect(screen.getByText('No transactions')).toBeInTheDocument();
	});

	it('renders a loading skeleton when isLoading', () => {
		const { container } = render(
			<CreditHistory transactions={[]} page={1} pageSize={10} totalItems={0} onPageChange={vi.fn()} isLoading />,
		);
		expect(container.querySelector('.animate-pulse')).not.toBeNull();
	});

	it('renders a wallet selector only when more than one wallet is supplied', () => {
		const { rerender } = render(
			<CreditHistory
				transactions={TRANSACTIONS}
				wallets={[{ id: 'w1', label: 'Main' }]}
				page={1}
				pageSize={10}
				totalItems={1}
				onPageChange={vi.fn()}
			/>,
		);
		expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
		rerender(
			<CreditHistory
				transactions={TRANSACTIONS}
				wallets={[
					{ id: 'w1', label: 'Main' },
					{ id: 'w2', label: 'Backup' },
				]}
				page={1}
				pageSize={10}
				totalItems={1}
				onPageChange={vi.fn()}
			/>,
		);
		expect(screen.getByRole('combobox')).toBeInTheDocument();
	});

	it('renders the translated fallback name for an unnamed wallet, not a blank option', () => {
		render(
			<CreditHistory
				transactions={TRANSACTIONS}
				wallets={[
					{ id: 'w1', label: 'Main' },
					{ id: 'w2', label: '' },
				]}
				selectedWalletId='w2'
				page={1}
				pageSize={10}
				totalItems={1}
				onPageChange={vi.fn()}
			/>,
		);
		expect(screen.getByText('Wallet w2')).toBeInTheDocument();
	});
});
