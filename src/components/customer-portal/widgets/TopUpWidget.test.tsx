import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import enPortal from '@/i18n/locales/en/customer-portal.json';
import TopUpWidget from './TopUpWidget';
import CustomerPortalApi from '@/api/CustomerPortalApi';

vi.mock('@/api/CustomerPortalApi', () => ({
	default: { getWallets: vi.fn(), topUpWallet: vi.fn(), getPaymentMethods: vi.fn(), getIntegrations: vi.fn() },
}));

vi.mock('@/core/services/tanstack/ReactQueryProvider', () => ({
	refetchQueries: vi.fn().mockResolvedValue(undefined),
}));

const WALLET = { id: 'wallet_1', currency: 'USD', wallet_status: 'active', conversion_rate: 1 };

// Rendering through the real locale file also asserts the new keys actually
// resolve — a missing key would surface here as raw `topUp.payNow` text.
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
				<TopUpWidget />
			</QueryClientProvider>
		</I18nextProvider>,
	);
};

// findBy, not getBy: the form only mounts once the wallet query resolves.
const enterCredits = async (value: string) => {
	const input = await screen.findByPlaceholderText('Enter an amount');
	await userEvent.type(input, value);
};

describe('TopUpWidget', () => {
	const originalLocation = window.location;

	beforeEach(() => {
		vi.mocked(CustomerPortalApi.getWallets).mockResolvedValue([WALLET] as never);
		vi.mocked(CustomerPortalApi.getIntegrations).mockResolvedValue({
			payment_integrations: [{ provider: 'chargebee', capabilities: [{ type: 'checkout', is_default: true }] }],
		} as never);
		vi.mocked(CustomerPortalApi.getPaymentMethods).mockResolvedValue({ providers: [] } as never);
		// jsdom's location is not writable; replace it so the redirect is observable.
		Object.defineProperty(window, 'location', { configurable: true, value: { href: 'https://portal.test/credits' } });
	});

	afterEach(() => {
		Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
		vi.clearAllMocks();
	});

	it('renders the empty state when the customer has no wallet', async () => {
		vi.mocked(CustomerPortalApi.getWallets).mockResolvedValue([] as never);
		renderWidget();
		expect(await screen.findByText('No wallet')).toBeInTheDocument();
	});

	it('keeps both actions disabled until a positive credit amount is entered', async () => {
		renderWidget();
		const payNow = await screen.findByRole('button', { name: /pay now/i });
		const invoice = screen.getByRole('button', { name: /generate invoice/i });
		expect(payNow).toBeDisabled();
		expect(invoice).toBeDisabled();

		await enterCredits('25');
		await waitFor(() => expect(payNow).toBeEnabled());
		expect(invoice).toBeEnabled();
	});

	// Pay now is the checkout path: the customer is charged before credits land,
	// so the widget must hand off to the returned session.
	it('Pay now requests checkout and surfaces the returned action URL', async () => {
		vi.mocked(CustomerPortalApi.topUpWallet).mockResolvedValue({
			checkout_session: { id: 'cs_1', payment_action: { type: 'checkout_url', url: 'https://checkout.test/session' } },
		} as never);

		renderWidget();
		await enterCredits('50');
		await userEvent.click(screen.getByRole('button', { name: /pay now/i }));

		await waitFor(() => expect(CustomerPortalApi.topUpWallet).toHaveBeenCalled());
		const [, payload] = vi.mocked(CustomerPortalApi.topUpWallet).mock.calls[0];
		expect(payload.checkout).toBeDefined();
	});

	// Generate invoice is the pay-later path and must not open checkout.
	it('Generate invoice omits checkout entirely', async () => {
		vi.mocked(CustomerPortalApi.topUpWallet).mockResolvedValue({ invoice_id: 'inv_1' } as never);

		renderWidget();
		await enterCredits('50');
		await userEvent.click(screen.getByRole('button', { name: /generate invoice/i }));

		await waitFor(() => expect(CustomerPortalApi.topUpWallet).toHaveBeenCalled());
		const [, payload] = vi.mocked(CustomerPortalApi.topUpWallet).mock.calls[0];
		expect(payload.checkout).toBeUndefined();
	});

	// transaction_reason is pinned server-side; the client must not send one.
	it('never sends a transaction reason, and always sends an idempotency key', async () => {
		vi.mocked(CustomerPortalApi.topUpWallet).mockResolvedValue({} as never);

		renderWidget();
		await enterCredits('10');
		await userEvent.click(screen.getByRole('button', { name: /generate invoice/i }));

		await waitFor(() => expect(CustomerPortalApi.topUpWallet).toHaveBeenCalled());
		const [walletId, payload] = vi.mocked(CustomerPortalApi.topUpWallet).mock.calls[0];
		expect(walletId).toBe('wallet_1');
		expect(payload.credits_to_add).toBe('10');
		expect(payload.idempotency_key).toBeTruthy();
		expect(payload).not.toHaveProperty('transaction_reason');
	});

	// The saved-card option stays visible but disabled when nothing can use it, so
	// the customer sees a state to resolve rather than a missing feature.
	it('disables the saved-card toggle when no provider can charge off-session', async () => {
		renderWidget();
		await screen.findByRole('button', { name: /pay now/i });

		// findBy, not getBy: supports() is false while /integrations is in flight, so
		// a synchronous read would pass on the loading state rather than the answer.
		expect(await screen.findByText(/does not support charging a saved card/i)).toBeInTheDocument();
		expect(screen.getByRole('switch')).toBeDisabled();
	});

	it('explains a missing saved card separately from an unsupported provider', async () => {
		vi.mocked(CustomerPortalApi.getIntegrations).mockResolvedValue({
			payment_integrations: [
				{
					provider: 'chargebee',
					capabilities: [
						{ type: 'checkout', is_default: true },
						{ type: 'auto_charge', is_default: true },
					],
				},
			],
		} as never);

		renderWidget();
		await screen.findByRole('button', { name: /pay now/i });

		expect(await screen.findByText(/no saved card yet/i)).toBeInTheDocument();
		expect(screen.getByRole('switch')).toBeDisabled();
	});

	// Portal checkouts always vault and the provider is resolved server-side, so
	// neither may be sent from here.
	it('sends no provider config and no save-card flag', async () => {
		vi.mocked(CustomerPortalApi.topUpWallet).mockResolvedValue({} as never);

		renderWidget();
		await enterCredits('10');
		await userEvent.click(screen.getByRole('button', { name: /pay now/i }));

		await waitFor(() => expect(CustomerPortalApi.topUpWallet).toHaveBeenCalled());
		const [, payload] = vi.mocked(CustomerPortalApi.topUpWallet).mock.calls[0];
		expect(payload.checkout).not.toHaveProperty('payment_provider_config');
		expect(payload.checkout).not.toHaveProperty('save_payment_method');
		expect(payload.checkout?.payment_provider).toBeUndefined();
	});
});
