import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import enPortal from '@/i18n/locales/en/customer-portal.json';
import AccountSummaryWidget from './AccountSummaryWidget';
import CustomerPortalApi from '@/api/CustomerPortalApi';

vi.mock('@/api/CustomerPortalApi', () => ({
	default: { getWallets: vi.fn(), getInvoices: vi.fn(), getSubscriptions: vi.fn() },
}));

vi.mock('./TopUpButton', () => ({ default: () => <button>Top up</button> }));

const renderWidget = () => {
	const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
	const i18n = createInstance();
	i18n.init({
		lng: 'en',
		fallbackLng: 'en',
		ns: ['customer-portal'],
		defaultNS: 'customer-portal',
		resources: { en: { 'customer-portal': enPortal } },
		interpolation: { escapeValue: false },
	});
	return render(
		<I18nextProvider i18n={i18n}>
			<QueryClientProvider client={client}>
				<AccountSummaryWidget />
			</QueryClientProvider>
		</I18nextProvider>,
	);
};

describe('AccountSummaryWidget', () => {
	beforeEach(() => {
		vi.mocked(CustomerPortalApi.getWallets).mockResolvedValue([
			{ id: 'w1', currency: 'USD', wallet_status: 'active', balance: -17681.6234 },
		] as never);
		vi.mocked(CustomerPortalApi.getSubscriptions).mockResolvedValue({
			items: [{ id: 's1', subscription_status: 'active', current_period_end: '2026-09-27T00:00:00Z' }],
		} as never);
	});

	afterEach(() => vi.clearAllMocks());

	// Only finalized, unsettled invoices are money the customer actually owes.
	it('sums amount due from finalized unpaid invoices only', async () => {
		vi.mocked(CustomerPortalApi.getInvoices).mockResolvedValue({
			items: [
				{ id: 'a', invoice_status: 'FINALIZED', payment_status: 'PENDING', amount_remaining: 120, currency: 'USD' },
				{ id: 'b', invoice_status: 'FINALIZED', payment_status: 'SUCCEEDED', amount_remaining: 0, currency: 'USD' },
				{ id: 'c', invoice_status: 'DRAFT', payment_status: 'PENDING', amount_remaining: 999, currency: 'USD' },
				{ id: 'd', invoice_status: 'VOIDED', payment_status: 'PENDING', amount_remaining: 500, currency: 'USD' },
			],
		} as never);

		renderWidget();

		// 120 only — the draft and voided invoices must not be counted.
		expect(await screen.findByText('$120.00')).toBeInTheDocument();
		expect(screen.queryByText('$1,619.00')).not.toBeInTheDocument();
	});

	it('shows the rounded balance with the sign outside the symbol', async () => {
		vi.mocked(CustomerPortalApi.getInvoices).mockResolvedValue({ items: [] } as never);
		renderWidget();
		expect(await screen.findByText('-$17,681.62')).toBeInTheDocument();
	});

	it('shows the next billing date from the active subscription', async () => {
		vi.mocked(CustomerPortalApi.getInvoices).mockResolvedValue({ items: [] } as never);
		renderWidget();
		expect(await screen.findByText('Next billing')).toBeInTheDocument();
		expect(screen.queryByText('—')).not.toBeInTheDocument();
	});

	it('falls back to a dash when there is no active subscription', async () => {
		vi.mocked(CustomerPortalApi.getInvoices).mockResolvedValue({ items: [] } as never);
		vi.mocked(CustomerPortalApi.getSubscriptions).mockResolvedValue({ items: [] } as never);
		renderWidget();
		expect(await screen.findByText('—')).toBeInTheDocument();
	});
});
