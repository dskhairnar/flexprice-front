import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import enPortal from '@/i18n/locales/en/customer-portal.json';
import AutoTopUpWidget from './AutoTopUpWidget';
import CustomerPortalApi from '@/api/CustomerPortalApi';

vi.mock('@/api/CustomerPortalApi', () => ({
	default: { getWallets: vi.fn(), updateAutoTopup: vi.fn(), getPaymentMethods: vi.fn() },
}));

vi.mock('@/core/services/tanstack/ReactQueryProvider', () => ({
	refetchQueries: vi.fn().mockResolvedValue(undefined),
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
		interpolation: { escapeValue: false },
	});
	return render(
		<I18nextProvider i18n={i18n}>
			<QueryClientProvider client={client}>
				<AutoTopUpWidget />
			</QueryClientProvider>
		</I18nextProvider>,
	);
};

const CONFIGURED = {
	id: 'wallet_1',
	currency: 'USD',
	wallet_status: 'active',
	auto_topup: { enabled: true, threshold: '20', amount: '100', invoicing: true },
};

describe('AutoTopUpWidget', () => {
	beforeEach(() => {
		vi.mocked(CustomerPortalApi.updateAutoTopup).mockResolvedValue({} as never);
		vi.mocked(CustomerPortalApi.getPaymentMethods).mockResolvedValue({ stripe: [] } as never);
	});

	afterEach(() => vi.clearAllMocks());

	it('renders the empty state when the customer has no wallet', async () => {
		vi.mocked(CustomerPortalApi.getWallets).mockResolvedValue([] as never);
		renderWidget();
		expect(await screen.findByText('No wallet')).toBeInTheDocument();
	});

	// The form seeds from the wallet on mount rather than through a syncing effect.
	it('seeds threshold and amount from the saved config', async () => {
		vi.mocked(CustomerPortalApi.getWallets).mockResolvedValue([CONFIGURED] as never);
		renderWidget();
		expect(await screen.findByDisplayValue('20')).toBeInTheDocument();
		expect(screen.getByDisplayValue('100')).toBeInTheDocument();
	});

	it('hides the configuration fields while auto top-up is off', async () => {
		vi.mocked(CustomerPortalApi.getWallets).mockResolvedValue([{ id: 'wallet_1', currency: 'USD', wallet_status: 'active' }] as never);
		renderWidget();
		await screen.findByRole('button', { name: /save settings/i });
		expect(screen.queryByDisplayValue('20')).not.toBeInTheDocument();
	});

	it('sends the configured threshold and amount on save', async () => {
		vi.mocked(CustomerPortalApi.getWallets).mockResolvedValue([CONFIGURED] as never);
		renderWidget();
		await userEvent.click(await screen.findByRole('button', { name: /save settings/i }));

		await waitFor(() => expect(CustomerPortalApi.updateAutoTopup).toHaveBeenCalled());
		const [walletId, payload] = vi.mocked(CustomerPortalApi.updateAutoTopup).mock.calls[0];
		expect(walletId).toBe('wallet_1');
		expect(payload.auto_topup).toMatchObject({ enabled: true, threshold: '20', amount: '100' });
	});

	// Auto-charging a saved card is meaningless without one, so the customer is told
	// rather than left with an option that silently cannot work.
	it('flags that there is no saved payment method to auto-charge', async () => {
		vi.mocked(CustomerPortalApi.getWallets).mockResolvedValue([CONFIGURED] as never);
		renderWidget();
		expect(await screen.findByText(/no saved payment method found/i)).toBeInTheDocument();
	});

	// invoicing is the inverse of auto-charge: charging the card means not billing later.
	it('maps auto-charge to invoicing=false when a saved card exists', async () => {
		vi.mocked(CustomerPortalApi.getWallets).mockResolvedValue([CONFIGURED] as never);
		vi.mocked(CustomerPortalApi.getPaymentMethods).mockResolvedValue({
			stripe: [{ id: 'seti_1', status: 'succeeded', customer_id: 'c1', is_default: true, created_at: 0, payment_method_id: 'pm_1' }],
		} as never);

		renderWidget();
		const autoCharge = await screen.findByLabelText(/automatically charge my saved payment method/i);
		await userEvent.click(autoCharge);
		await userEvent.click(screen.getByRole('button', { name: /save settings/i }));

		await waitFor(() => expect(CustomerPortalApi.updateAutoTopup).toHaveBeenCalled());
		const [, payload] = vi.mocked(CustomerPortalApi.updateAutoTopup).mock.calls[0];
		expect(payload.auto_topup.invoicing).toBe(false);
	});

	// Omitting cooldown leaves a stored one in place; value 0 is what clears it.
	it('clears a cooloff by sending zero rather than omitting the field', async () => {
		vi.mocked(CustomerPortalApi.getWallets).mockResolvedValue([CONFIGURED] as never);
		renderWidget();
		await userEvent.click(await screen.findByRole('button', { name: /save settings/i }));

		await waitFor(() => expect(CustomerPortalApi.updateAutoTopup).toHaveBeenCalled());
		const [, payload] = vi.mocked(CustomerPortalApi.updateAutoTopup).mock.calls[0];
		expect(payload.auto_topup.cooldown).toEqual({ value: 0, unit: 'second' });
	});
});
