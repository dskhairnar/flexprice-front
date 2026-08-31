import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import CreditBalance from './CreditBalance';

const wallet = (over: Partial<Parameters<typeof CreditBalance>[0]['wallet']> = {}) =>
	({ id: 'w1', name: 'Prepaid Wallet', status: 'active', creditBalance: 200, balance: 100.5, currency: 'USD', ...over }) as never;

describe('CreditBalance formatting', () => {
	// Regression: the portal rendered `-15,029.004249893753 credits` to customers.
	it('rounds a full-precision credit balance', () => {
		render(<CreditBalance wallet={wallet({ creditBalance: -15029.004249893753, balance: -17681.6234 })} />);
		expect(screen.getByText(/-15,029 credits/)).toBeInTheDocument();
		expect(screen.queryByText(/004249893753/)).not.toBeInTheDocument();
	});

	// The sign belongs outside the currency symbol: -$17,681.62, never $-17,681.62.
	it('leads with the monetary value at two decimals, sign before the symbol', () => {
		render(<CreditBalance wallet={wallet({ balance: -17681.6234 })} />);
		expect(screen.getByText((_, el) => el?.textContent === '-$17,681.62')).toBeInTheDocument();
	});

	it('renders a positive balance without a sign', () => {
		render(<CreditBalance wallet={wallet({ balance: 100.5 })} />);
		expect(screen.getByText((_, el) => el?.textContent === '$100.50')).toBeInTheDocument();
	});

	// A negative balance is a state the customer must be able to name, not infer.
	it('explains an overdrawn balance', () => {
		render(<CreditBalance wallet={wallet({ balance: -20, creditBalance: -20 })} />);
		expect(screen.getByText('Your current usage exceeds available credits.')).toBeInTheDocument();
	});

	it('does not show the overdrawn explanation on a healthy balance', () => {
		render(<CreditBalance wallet={wallet()} />);
		expect(screen.queryByText('Your current usage exceeds available credits.')).not.toBeInTheDocument();
	});

	it('renders a header action when one is supplied', () => {
		render(<CreditBalance wallet={wallet()} actions={<button>Top up</button>} />);
		expect(screen.getByRole('button', { name: 'Top up' })).toBeInTheDocument();
	});
});
