// src/credits/components/CreditBalance.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import enCommon from '@/i18n/locales/en/common.json';
import CreditBalance from './CreditBalance';

describe('CreditBalance', () => {
	it('renders the wallet name, status, and balance', () => {
		render(
			<CreditBalance wallet={{ id: 'w1', name: 'Main Wallet', status: 'active', creditBalance: 200, balance: 100.5, currency: 'USD' }} />,
		);
		expect(screen.getByText('Main Wallet')).toBeInTheDocument();
	});

	it('renders the empty state when wallet is null', () => {
		render(<CreditBalance wallet={null} />);
		expect(screen.getByText('No wallet')).toBeInTheDocument();
	});

	it('renders a loading skeleton when isLoading', () => {
		const { container } = render(<CreditBalance wallet={null} isLoading />);
		expect(container.querySelector('.animate-pulse')).not.toBeNull();
	});

	it('renders a real translated title through a host i18next instance (regression test for the usage-widgets locale-key bug)', () => {
		const instance = createInstance();
		instance.init({ lng: 'en', fallbackLng: 'en', ns: ['common'], defaultNS: 'common', resources: { en: { common: enCommon } } });
		render(
			<I18nextProvider i18n={instance}>
				<CreditBalance wallet={null} />
			</I18nextProvider>,
		);
		// Must resolve through the HOST's real common.json — not the bundled fallback text, and never the raw key.
		expect(screen.getByText('No wallet')).toBeInTheDocument();
		expect(screen.queryByText('creditWidgets.emptyTitle')).not.toBeInTheDocument();
	});
});
