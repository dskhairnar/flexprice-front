// src/credits/adapters.test.ts
import { describe, it, expect } from 'vitest';
import { WALLET_STATUS, WALLET_TRANSACTION_REASON } from '@/models/Wallet';
import { adaptCreditBalance, adaptCreditTransactions, adaptWalletOptions } from './adapters';

const WALLET = {
	id: 'wallet_1',
	customer_id: 'cust_1',
	name: 'Main Wallet',
	currency: 'USD',
	description: '',
	balance: '100.50',
	credit_balance: '200',
	wallet_status: WALLET_STATUS.ACTIVE,
	metadata: {},
	wallet_type: 'PREPAID',
	config: { allowed_price_types: [] },
	conversion_rate: '1',
	created_at: '',
	updated_at: '',
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

describe('adaptCreditBalance', () => {
	it('prefers realtime balance data over the wallet snapshot', () => {
		const result = adaptCreditBalance(WALLET, {
			currency: 'EUR',
			balance: '999',
			credit_balance: '999',
			real_time_balance: '150.75',
			real_time_credit_balance: '300',
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any);
		expect(result).toEqual({ id: 'wallet_1', name: 'Main Wallet', status: 'active', creditBalance: 300, balance: 150.75, currency: 'EUR' });
	});

	it('falls back to the wallet snapshot when no realtime data is available', () => {
		const result = adaptCreditBalance(WALLET);
		expect(result).toEqual({ id: 'wallet_1', name: 'Main Wallet', status: 'active', creditBalance: 200, balance: 100.5, currency: 'USD' });
	});

	it('maps frozen and closed statuses', () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect(adaptCreditBalance({ ...WALLET, wallet_status: WALLET_STATUS.FROZEN } as any).status).toBe('frozen');
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect(adaptCreditBalance({ ...WALLET, wallet_status: WALLET_STATUS.CLOSED } as any).status).toBe('closed');
	});

	it('defaults currency to USD when neither source provides one', () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = adaptCreditBalance({ ...WALLET, currency: '' } as any);
		expect(result.currency).toBe('USD');
	});
});

describe('adaptCreditTransactions', () => {
	it('maps transaction fields', () => {
		const result = adaptCreditTransactions([
			{
				id: 'tx_1',
				amount: 100,
				balance_after: 200,
				balance_before: 100,
				created_at: '2026-01-01T00:00:00Z',
				description: '',
				metadata: {},
				reference_id: '',
				reference_type: '',
				transaction_status: 'completed',
				type: 'credit',
				wallet_id: 'w1',
				credit_amount: 90,
				transaction_reason: WALLET_TRANSACTION_REASON.FREE_CREDIT_GRANT,
				expiry_date: '2026-06-01T00:00:00Z',
				priority: 1,
				currency: 'USD',
			},
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		] as any);
		expect(result).toEqual([
			{
				id: 'tx_1',
				type: 'credit',
				amount: 100,
				creditAmount: 90,
				currency: 'USD',
				reason: WALLET_TRANSACTION_REASON.FREE_CREDIT_GRANT,
				createdAt: '2026-01-01T00:00:00Z',
				expiryDate: '2026-06-01T00:00:00Z',
				priority: 1,
				transactionStatus: 'completed',
			},
		]);
	});

	it('treats any non-debit type as credit, and leaves an empty expiry_date undefined', () => {
		const result = adaptCreditTransactions([
			{ id: 'tx_2', type: 'debit', amount: 5, credit_amount: 5, created_at: '', transaction_reason: 'X', expiry_date: '' },
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		] as any);
		expect(result[0].type).toBe('debit');
		expect(result[0].expiryDate).toBeUndefined();
	});

	it('returns [] for empty/undefined input', () => {
		expect(adaptCreditTransactions([])).toEqual([]);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect(adaptCreditTransactions(undefined as any)).toEqual([]);
	});
});

describe('adaptWalletOptions', () => {
	it('maps wallets to id/label options', () => {
		const result = adaptWalletOptions([
			{ id: 'w1', name: 'Main' },
			{ id: 'w2', name: '' },
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		] as any);
		expect(result).toEqual([
			{ id: 'w1', label: 'Main' },
			{ id: 'w2', label: '' },
		]);
	});
});
