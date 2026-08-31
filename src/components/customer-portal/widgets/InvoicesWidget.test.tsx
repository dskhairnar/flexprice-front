import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import enPortal from '@/i18n/locales/en/customer-portal.json';
import InvoicesWidget from './InvoicesWidget';
import CustomerPortalApi from '@/api/CustomerPortalApi';

vi.mock('@/api/CustomerPortalApi', () => ({
	default: {
		getInvoices: vi.fn(),
		getInvoice: vi.fn(),
		downloadInvoicePdf: vi.fn(),
		payInvoiceWithCheckout: vi.fn(),
	},
}));

vi.mock('@/context/PortalConfigContext', () => ({
	usePortalConfig: () => ({ config: {} }),
}));

const UNPAID = {
	id: 'inv_unpaid',
	invoice_number: 'INV-000484',
	invoice_status: 'FINALIZED',
	payment_status: 'PENDING',
	total: 120,
	subtotal: 100,
	total_tax: 20,
	amount_paid: 0,
	amount_remaining: 120,
	currency: 'USD',
	created_at: '2025-08-27T00:00:00Z',
	finalized_at: '2025-08-27T00:00:00Z',
	due_date: '2099-09-27T00:00:00Z',
	period_start: '2025-08-27T00:00:00Z',
	period_end: '2025-09-27T00:00:00Z',
	line_items: [],
};

const PAID = {
	...UNPAID,
	id: 'inv_paid',
	invoice_number: 'INV-000485',
	payment_status: 'SUCCEEDED',
	amount_remaining: 0,
	amount_paid: 120,
};

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
				<InvoicesWidget />
			</QueryClientProvider>
		</I18nextProvider>,
	);
};

describe('InvoicesWidget', () => {
	const originalLocation = window.location;

	beforeEach(() => {
		// jsdom's location is not writable; replace it so the redirect is observable.
		Object.defineProperty(window, 'location', { configurable: true, value: { href: 'https://portal.test/invoices' } });
		vi.mocked(CustomerPortalApi.getInvoices).mockResolvedValue({ items: [UNPAID, PAID] } as never);
		vi.mocked(CustomerPortalApi.getInvoice).mockResolvedValue({ ...UNPAID, line_items: [] } as never);
	});

	afterEach(() => {
		Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
		vi.clearAllMocks();
	});

	it('gives an unpaid invoice the primary Pay action and a paid one only View', async () => {
		renderWidget();

		const unpaidRow = (await screen.findByText('INV-000484')).closest('tr')!;
		const paidRow = screen.getByText('INV-000485').closest('tr')!;

		expect(within(unpaidRow).getByRole('button', { name: /pay now/i })).toBeInTheDocument();
		expect(within(paidRow).queryByRole('button', { name: /pay now/i })).not.toBeInTheDocument();
		expect(within(paidRow).getByRole('button', { name: /^view$/i })).toBeInTheDocument();
	});

	// Pay starts a hosted payment and hands off to the returned URL.
	it('Pay now starts a payment and redirects to the returned URL', async () => {
		vi.mocked(CustomerPortalApi.payInvoiceWithCheckout).mockResolvedValue({
			payment_id: 'pay_1',
			payment_url: 'https://pay.test/link',
			status: 'PENDING',
		} as never);

		renderWidget();
		const unpaidRow = (await screen.findByText('INV-000484')).closest('tr')!;
		await userEvent.click(within(unpaidRow).getByRole('button', { name: /pay now/i }));

		await waitFor(() => expect(window.location.href).toBe('https://pay.test/link'));
	});

	// A retry must reuse the key, or the customer is charged twice for one invoice.
	it('reuses the idempotency key when the same invoice is retried', async () => {
		vi.mocked(CustomerPortalApi.payInvoiceWithCheckout)
			.mockRejectedValueOnce(new Error('network'))
			.mockResolvedValue({ payment_id: 'pay_1', status: 'PENDING' } as never);

		renderWidget();
		const unpaidRow = (await screen.findByText('INV-000484')).closest('tr')!;
		const payButton = within(unpaidRow).getByRole('button', { name: /pay now/i });

		await userEvent.click(payButton);
		await waitFor(() => expect(CustomerPortalApi.payInvoiceWithCheckout).toHaveBeenCalledTimes(1));
		await userEvent.click(payButton);
		await waitFor(() => expect(CustomerPortalApi.payInvoiceWithCheckout).toHaveBeenCalledTimes(2));

		const calls = vi.mocked(CustomerPortalApi.payInvoiceWithCheckout).mock.calls;
		expect(calls[0][1].idempotency_key).toBeTruthy();
		expect(calls[1][1].idempotency_key).toBe(calls[0][1].idempotency_key);
	});

	// The link is surfaced as well as followed, so a blocked redirect still leaves
	// the customer something they can open by hand.
	it('shows the payment link in a dialog alongside the redirect', async () => {
		vi.mocked(CustomerPortalApi.payInvoiceWithCheckout).mockResolvedValue({
			payment_id: 'pay_1',
			payment_url: 'https://pay.test/link',
			status: 'PENDING',
		} as never);

		renderWidget();
		const unpaidRow = (await screen.findByText('INV-000484')).closest('tr')!;
		await userEvent.click(within(unpaidRow).getByRole('button', { name: /pay now/i }));

		expect(await screen.findByText('https://pay.test/link')).toBeInTheDocument();
	});

	it('opens the detail drawer from the invoice number and loads the full invoice', async () => {
		renderWidget();
		await userEvent.click(await screen.findByText('INV-000484'));

		await waitFor(() => expect(CustomerPortalApi.getInvoice).toHaveBeenCalledWith('inv_unpaid'));
		expect(await screen.findByText('Billing period')).toBeInTheDocument();
		// Appears twice by design: as the hero label and as the closing line of the
		// subtotal → total → paid → due breakdown.
		expect(screen.getAllByText('Amount due').length).toBeGreaterThan(0);
	});

	it('shows the invoice totals breakdown in the drawer', async () => {
		renderWidget();
		await userEvent.click(await screen.findByText('INV-000484'));

		expect(await screen.findByText('Subtotal')).toBeInTheDocument();
		expect(screen.getByText('Tax')).toBeInTheDocument();
	});
});
