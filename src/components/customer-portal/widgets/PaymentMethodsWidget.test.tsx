import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import enPortal from '@/i18n/locales/en/customer-portal.json';
import PaymentMethodsWidget from './PaymentMethodsWidget';
import CustomerPortalApi from '@/api/CustomerPortalApi';

vi.mock('@/api/CustomerPortalApi', () => ({
	default: {
		getIntegrations: vi.fn(),
		getPaymentMethods: vi.fn(),
		addPaymentMethod: vi.fn(),
		deletePaymentMethod: vi.fn(),
		setDefaultPaymentMethod: vi.fn(),
	},
}));

vi.mock('@/core/services/tanstack/ReactQueryProvider', () => ({
	refetchQueries: vi.fn().mockResolvedValue(undefined),
}));

const FULL_CAPABILITIES = {
	payment_integrations: [
		{
			provider: 'chargebee',
			capabilities: [
				{ type: 'payment_method_management', is_default: true },
				{ type: 'set_default_method', is_default: true },
			],
		},
	],
};

const card = (over: Record<string, unknown> = {}) => ({
	id: 'pm_1',
	provider: 'chargebee',
	type: 'CARD',
	status: 'ACTIVE',
	card: { brand: 'visa', last4: '4242', exp_month: 4, exp_year: 2030 },
	is_default: true,
	can_auto_charge: true,
	...over,
});

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
				<PaymentMethodsWidget />
			</QueryClientProvider>
		</I18nextProvider>,
	);
};

describe('PaymentMethodsWidget', () => {
	const originalLocation = window.location;

	beforeEach(() => {
		vi.mocked(CustomerPortalApi.getIntegrations).mockResolvedValue(FULL_CAPABILITIES as never);
		Object.defineProperty(window, 'location', { configurable: true, value: { href: 'https://portal.test/methods' } });
	});

	afterEach(() => {
		Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
		vi.clearAllMocks();
	});

	it('renders the empty state when no cards are saved', async () => {
		vi.mocked(CustomerPortalApi.getPaymentMethods).mockResolvedValue({ providers: [] } as never);
		renderWidget();
		expect(await screen.findByText('No payment methods')).toBeInTheDocument();
	});

	it('renders a saved card with brand, last4, expiry and the default badge', async () => {
		vi.mocked(CustomerPortalApi.getPaymentMethods).mockResolvedValue({
			providers: [{ provider: 'chargebee', items: [card()] }],
		} as never);

		renderWidget();

		expect(await screen.findByText('visa •••• 4242')).toBeInTheDocument();
		expect(screen.getByText('Expires 04/30')).toBeInTheDocument();
		expect(screen.getByText('Default')).toBeInTheDocument();
	});

	// A provider that could not be read is not the same as one with no cards —
	// an empty list cannot express "we could not ask", and the two need different UI.
	it('distinguishes a provider that could not be read from one with no cards', async () => {
		vi.mocked(CustomerPortalApi.getPaymentMethods).mockResolvedValue({
			providers: [{ provider: 'chargebee', items: [], error: { message: 'gateway timeout' } }],
		} as never);

		renderWidget();

		expect(await screen.findByText(/couldn't load/i)).toBeInTheDocument();
		expect(screen.getByText('gateway timeout')).toBeInTheDocument();
		expect(screen.queryByText('No payment methods')).not.toBeInTheDocument();
	});

	// Defaults are scoped per provider, so both fields must be sent.
	it('sends provider and method id when promoting a card to default', async () => {
		vi.mocked(CustomerPortalApi.getPaymentMethods).mockResolvedValue({
			providers: [{ provider: 'chargebee', items: [card(), card({ id: 'pm_2', is_default: false })] }],
		} as never);
		vi.mocked(CustomerPortalApi.setDefaultPaymentMethod).mockResolvedValue({} as never);

		renderWidget();
		const buttons = await screen.findAllByRole('button', { name: /set as default/i });
		expect(buttons).toHaveLength(1);

		await userEvent.click(buttons[0]);
		await waitFor(() =>
			expect(CustomerPortalApi.setDefaultPaymentMethod).toHaveBeenCalledWith({
				payment_provider: 'chargebee',
				payment_method_id: 'pm_2',
			}),
		);
	});

	// Removing a card is destructive and irreversible, so it is confirmed first.
	it('confirms before removing a card, then sends provider and method id', async () => {
		vi.mocked(CustomerPortalApi.getPaymentMethods).mockResolvedValue({
			providers: [{ provider: 'chargebee', items: [card()] }],
		} as never);
		vi.mocked(CustomerPortalApi.deletePaymentMethod).mockResolvedValue({} as never);

		renderWidget();
		await userEvent.click(await screen.findByRole('button', { name: /remove/i }));
		expect(CustomerPortalApi.deletePaymentMethod).not.toHaveBeenCalled();

		// The row action and the dialog's confirm share a label, so scope to the dialog.
		const dialog = await screen.findByRole('dialog');
		await userEvent.click(within(dialog).getByRole('button', { name: /^remove$/i }));

		await waitFor(() =>
			expect(CustomerPortalApi.deletePaymentMethod).toHaveBeenCalledWith({
				payment_provider: 'chargebee',
				payment_method_id: 'pm_1',
			}),
		);
	});

	// Adding returns an action, not a method — follow it only when it is a redirect.
	it('follows a redirect action when adding a card', async () => {
		vi.mocked(CustomerPortalApi.getPaymentMethods).mockResolvedValue({ providers: [] } as never);
		vi.mocked(CustomerPortalApi.addPaymentMethod).mockResolvedValue({
			provider: 'chargebee',
			action: { type: 'redirect', url: 'https://vault.test/setup' },
		} as never);

		renderWidget();
		await userEvent.click(await screen.findByRole('button', { name: /add card/i }));

		await waitFor(() => expect(window.location.href).toBe('https://vault.test/setup'));
	});

	// type 'none' means the provider vaulted server-to-server; there is nothing to
	// redirect to and waiting for a return trip would hang the flow.
	it('does not redirect when the setup action is none', async () => {
		vi.mocked(CustomerPortalApi.getPaymentMethods).mockResolvedValue({ providers: [] } as never);
		vi.mocked(CustomerPortalApi.addPaymentMethod).mockResolvedValue({
			provider: 'chargebee',
			action: { type: 'none' },
		} as never);

		renderWidget();
		await userEvent.click(await screen.findByRole('button', { name: /add card/i }));

		await waitFor(() => expect(CustomerPortalApi.addPaymentMethod).toHaveBeenCalled());
		expect(window.location.href).toBe('https://portal.test/methods');
	});

	// No connected provider can manage methods, so the actions would be dead.
	it('says so when no provider supports managing payment methods', async () => {
		vi.mocked(CustomerPortalApi.getIntegrations).mockResolvedValue({ payment_integrations: [] } as never);
		vi.mocked(CustomerPortalApi.getPaymentMethods).mockResolvedValue({ providers: [] } as never);

		renderWidget();

		expect(await screen.findByText(/not available/i)).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /add card/i })).not.toBeInTheDocument();
	});
});
