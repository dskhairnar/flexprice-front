import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import enPortal from '@/i18n/locales/en/customer-portal.json';
import PaymentMethodsWidget from './PaymentMethodsWidget';
import CustomerPortalApi from '@/api/CustomerPortalApi';

vi.mock('@/core/services/tanstack/ReactQueryProvider', () => ({
	refetchQueries: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/api/CustomerPortalApi', () => ({
	default: {
		getPaymentMethods: vi.fn(),
		addPaymentMethod: vi.fn(),
		setDefaultPaymentMethod: vi.fn(),
	},
}));

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
				<PaymentMethodsWidget />
			</QueryClientProvider>
		</I18nextProvider>,
	);
};

describe('PaymentMethodsWidget', () => {
	const originalLocation = window.location;

	beforeEach(() => {
		Object.defineProperty(window, 'location', {
			configurable: true,
			value: { href: 'https://portal.test/payment-methods' },
		});
	});

	afterEach(() => {
		Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
		vi.clearAllMocks();
	});

	it('renders the empty state when no cards are saved', async () => {
		vi.mocked(CustomerPortalApi.getPaymentMethods).mockResolvedValue({ stripe: [] } as never);
		renderWidget();
		expect(await screen.findByText('No payment methods')).toBeInTheDocument();
	});

	it('renders saved cards with brand, last4, expiry, and the default badge', async () => {
		vi.mocked(CustomerPortalApi.getPaymentMethods).mockResolvedValue({
			stripe: [
				{
					id: 'seti_1',
					status: 'succeeded',
					customer_id: 'cus_1',
					is_default: true,
					created_at: 0,
					payment_method_details: { id: 'pm_1', type: 'card', card: { brand: 'visa', last4: '4242', exp_month: 4, exp_year: 2030 } },
				},
			],
		} as never);

		renderWidget();

		expect(await screen.findByText('visa •••• 4242')).toBeInTheDocument();
		expect(screen.getByText('Expires 04/30')).toBeInTheDocument();
		expect(screen.getByText('Default')).toBeInTheDocument();
	});

	it('offers Set as default only on non-default methods, and promotes the chosen one', async () => {
		vi.mocked(CustomerPortalApi.getPaymentMethods).mockResolvedValue({
			stripe: [
				{
					id: 'seti_1',
					status: 'succeeded',
					customer_id: 'cus_1',
					is_default: true,
					created_at: 0,
					payment_method_id: 'pm_default',
					payment_method_details: { id: 'pm_default', type: 'card', card: { brand: 'visa', last4: '4242', exp_month: 4, exp_year: 2030 } },
				},
				{
					id: 'seti_2',
					status: 'succeeded',
					customer_id: 'cus_1',
					is_default: false,
					created_at: 0,
					payment_method_id: 'pm_other',
					payment_method_details: { id: 'pm_other', type: 'card', card: { brand: 'amex', last4: '0005', exp_month: 1, exp_year: 2031 } },
				},
			],
		} as never);
		vi.mocked(CustomerPortalApi.setDefaultPaymentMethod).mockResolvedValue({ message: 'ok' } as never);

		renderWidget();

		// Exactly one row is promotable — the one that is not already default.
		const buttons = await screen.findAllByRole('button', { name: /set as default/i });
		expect(buttons).toHaveLength(1);

		await userEvent.click(buttons[0]);
		await waitFor(() => expect(CustomerPortalApi.setDefaultPaymentMethod).toHaveBeenCalledWith({ payment_method_id: 'pm_other' }));
	});

	// Cards are captured on the provider's hosted page, so the widget must redirect
	// rather than collect card details itself.
	it('redirects to the hosted checkout URL when adding a card', async () => {
		vi.mocked(CustomerPortalApi.getPaymentMethods).mockResolvedValue({ stripe: [] } as never);
		vi.mocked(CustomerPortalApi.addPaymentMethod).mockResolvedValue({
			checkout_url: 'https://checkout.test/setup',
		} as never);

		renderWidget();
		await userEvent.click(await screen.findByRole('button', { name: /add card/i }));

		await waitFor(() => expect(window.location.href).toBe('https://checkout.test/setup'));
	});
});
