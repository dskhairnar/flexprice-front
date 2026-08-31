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
	default: {
		getWallets: vi.fn(),
		topUpWallet: vi.fn(),
	},
}));

vi.mock('@/core/services/tanstack/ReactQueryProvider', () => ({
	refetchQueries: vi.fn().mockResolvedValue(undefined),
}));

const WALLET = { id: 'wallet_1', currency: 'USD', wallet_status: 'active', conversion_rate: 1 };

// Rendering through the real locale file also asserts the new keys actually
// resolve — a missing key would surface here as raw `topUp.action` text.
const renderWidget = () => {
	const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
	const i18n = createInstance();
	i18n.init({
		lng: 'en',
		fallbackLng: 'en',
		ns: ['customer-portal'],
		defaultNS: 'customer-portal',
		resources: { en: { 'customer-portal': enPortal } },
		// Mirrors the app's own i18n init — React already escapes, so double-escaping
		// here would turn interpolated values like "04/30" into "04&#x2F;30".
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

describe('TopUpWidget', () => {
	const originalLocation = window.location;

	beforeEach(() => {
		vi.mocked(CustomerPortalApi.getWallets).mockResolvedValue([WALLET] as never);
		// jsdom's location is not writable; replace it so the redirect is observable.
		Object.defineProperty(window, 'location', {
			configurable: true,
			value: { href: 'https://portal.test/credits' },
		});
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

	it('keeps the confirm action disabled until a positive credit amount is entered', async () => {
		renderWidget();
		const action = await screen.findByRole('button', { name: /continue to checkout/i });
		expect(action).toBeDisabled();

		await userEvent.click(screen.getByRole('button', { name: /^25 credits$/i }));
		await waitFor(() => expect(action).toBeEnabled());
	});

	// The whole point of the checkout flow: the customer is charged before credits land,
	// so the widget must hand off to the returned session rather than reporting success.
	it('redirects to the checkout session returned by the API', async () => {
		vi.mocked(CustomerPortalApi.topUpWallet).mockResolvedValue({
			checkout_session: { id: 'cs_1', payment_action: { redirect_url: 'https://checkout.test/session' } },
		} as never);

		renderWidget();
		await userEvent.click(await screen.findByRole('button', { name: /^50 credits$/i }));
		await userEvent.click(screen.getByRole('button', { name: /continue to checkout/i }));

		await waitFor(() => expect(window.location.href).toBe('https://checkout.test/session'));
	});

	// transaction_reason is pinned server-side; the client must not try to send one.
	it('requests a checkout-backed top-up without a transaction reason', async () => {
		vi.mocked(CustomerPortalApi.topUpWallet).mockResolvedValue({} as never);

		renderWidget();
		await userEvent.click(await screen.findByRole('button', { name: /^10 credits$/i }));
		await userEvent.click(screen.getByRole('button', { name: /continue to checkout/i }));

		await waitFor(() => expect(CustomerPortalApi.topUpWallet).toHaveBeenCalled());
		const [walletId, payload] = vi.mocked(CustomerPortalApi.topUpWallet).mock.calls[0];
		expect(walletId).toBe('wallet_1');
		expect(payload.credits_to_add).toBe('10');
		// Must match a value CheckoutPaymentProvider accepts, or the backend 400s.
		expect(payload.checkout?.payment_provider).toBe('razorpay');
		expect(payload).not.toHaveProperty('transaction_reason');
	});

	// The backend requires this: its fallback key is timestamp-derived, so a retry
	// without one would be treated as a fresh top-up and grant the credits twice.
	it('sends an idempotency key, stable across retries of the same attempt', async () => {
		vi.mocked(CustomerPortalApi.topUpWallet)
			.mockRejectedValueOnce(new Error('network'))
			.mockResolvedValue({} as never);

		renderWidget();
		await userEvent.click(await screen.findByRole('button', { name: /^10 credits$/i }));
		const confirm = screen.getByRole('button', { name: /continue to checkout/i });

		await userEvent.click(confirm);
		await waitFor(() => expect(CustomerPortalApi.topUpWallet).toHaveBeenCalledTimes(1));
		await userEvent.click(confirm);
		await waitFor(() => expect(CustomerPortalApi.topUpWallet).toHaveBeenCalledTimes(2));

		const calls = vi.mocked(CustomerPortalApi.topUpWallet).mock.calls;
		expect(calls[0][1].idempotency_key).toBeTruthy();
		expect(calls[1][1].idempotency_key).toBe(calls[0][1].idempotency_key);
	});
});
