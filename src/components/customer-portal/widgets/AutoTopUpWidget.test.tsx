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
	default: {
		getWallets: vi.fn(),
		updateAutoTopup: vi.fn(),
	},
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
		// Mirrors the app's own i18n init — React already escapes, so double-escaping
		// here would turn interpolated values like "04/30" into "04&#x2F;30".
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

describe('AutoTopUpWidget', () => {
	beforeEach(() => {
		vi.mocked(CustomerPortalApi.updateAutoTopup).mockResolvedValue({} as never);
	});

	afterEach(() => vi.clearAllMocks());

	it('renders the empty state when the customer has no wallet', async () => {
		vi.mocked(CustomerPortalApi.getWallets).mockResolvedValue([] as never);
		renderWidget();
		expect(await screen.findByText('No wallet')).toBeInTheDocument();
	});

	// A wallet with auto top-up already configured opens as a one-line summary rather
	// than a wall of raw fields.
	it('summarises a saved config in plain language instead of showing the fields', async () => {
		vi.mocked(CustomerPortalApi.getWallets).mockResolvedValue([
			{
				id: 'wallet_1',
				currency: 'USD',
				wallet_status: 'active',
				auto_topup: { enabled: true, threshold: '20', amount: '100', invoicing: true },
			},
		] as never);

		renderWidget();

		expect(await screen.findByText('Automatically add $100.00 when your balance falls below $20.00.')).toBeInTheDocument();
		expect(screen.queryByDisplayValue('20')).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: /manage/i })).toBeInTheDocument();
	});

	it('tells the customer when auto top-up is off and offers to enable it', async () => {
		vi.mocked(CustomerPortalApi.getWallets).mockResolvedValue([{ id: 'wallet_1', currency: 'USD', wallet_status: 'active' }] as never);

		renderWidget();

		// Nothing configured yet, so the form opens directly rather than summarising.
		expect(await screen.findByRole('button', { name: /save settings/i })).toBeInTheDocument();
	});

	it('seeds the fields from the saved auto top-up config once Manage is opened', async () => {
		vi.mocked(CustomerPortalApi.getWallets).mockResolvedValue([
			{
				id: 'wallet_1',
				currency: 'USD',
				wallet_status: 'active',
				auto_topup: { enabled: true, threshold: '15', amount: '75', invoicing: true },
			},
		] as never);

		renderWidget();
		await userEvent.click(await screen.findByRole('button', { name: /manage/i }));

		expect(await screen.findByDisplayValue('15')).toBeInTheDocument();
		expect(screen.getByDisplayValue('75')).toBeInTheDocument();
	});

	// Threshold and amount inputs only exist while enabled, so a wallet with auto
	// top-up off must not show them.
	it('hides the threshold and amount fields while auto top-up is off', async () => {
		vi.mocked(CustomerPortalApi.getWallets).mockResolvedValue([{ id: 'wallet_1', currency: 'USD', wallet_status: 'active' }] as never);

		renderWidget();

		await screen.findByRole('button', { name: /save settings/i });
		expect(screen.queryByLabelText(/top up when balance falls below/i)).not.toBeInTheDocument();
	});

	it('sends the configured threshold and amount on save', async () => {
		vi.mocked(CustomerPortalApi.getWallets).mockResolvedValue([
			{
				id: 'wallet_1',
				currency: 'USD',
				wallet_status: 'active',
				auto_topup: { enabled: true, threshold: '20', amount: '100', invoicing: true },
			},
		] as never);

		renderWidget();
		await userEvent.click(await screen.findByRole('button', { name: /manage/i }));
		await userEvent.click(await screen.findByRole('button', { name: /save settings/i }));

		await waitFor(() => expect(CustomerPortalApi.updateAutoTopup).toHaveBeenCalled());
		const [walletId, payload] = vi.mocked(CustomerPortalApi.updateAutoTopup).mock.calls[0];
		expect(walletId).toBe('wallet_1');
		expect(payload.auto_topup).toMatchObject({ enabled: true, threshold: '20', amount: '100' });
	});
});
