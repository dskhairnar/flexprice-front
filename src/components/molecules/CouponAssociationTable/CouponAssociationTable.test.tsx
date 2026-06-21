import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import { createInstance } from 'i18next';
import type { i18n as I18nInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import CouponAssociationTable from './CouponAssociationTable';

vi.mock('@/api/CouponApi', () => ({
	default: {
		listCouponAssociations: vi.fn().mockResolvedValue({
			items: [
				{
					id: 'assoc_1',
					coupon_id: 'cpn_1',
					subscription_id: 'sub_1',
					start_date: '2026-01-01T00:00:00Z',
					end_date: undefined,
					status: 'active',
					created_at: '2026-01-01T00:00:00Z',
					updated_at: '2026-01-01T00:00:00Z',
					created_by: '',
					updated_by: '',
					tenant_id: '',
					environment_id: '',
					coupon: {
						id: 'cpn_1',
						name: 'Summer Sale',
						coupon_code: 'SUMMER20',
						type: 'percentage',
						cadence: 'once',
						percentage_off: '20',
						currency: 'usd',
						total_redemptions: 0,
						status: 'active',
						created_at: '',
						updated_at: '',
						created_by: '',
						updated_by: '',
						tenant_id: '',
						environment_id: '',
					},
				},
			],
			pagination: { limit: 10, offset: 0, total: 1 },
		}),
	},
}));
vi.mock('@/core/services/supbase/config', () => ({ default: {} }));
vi.mock('@/core/auth/AuthService', () => ({ default: {} }));
vi.mock('react-router', async () => {
	const actual = await vi.importActual('react-router');
	return { ...actual, useNavigate: () => vi.fn() };
});

let testI18n: I18nInstance;
beforeAll(async () => {
	const instance = createInstance();
	await instance.use(initReactI18next).init({
		lng: 'en',
		fallbackLng: 'en',
		ns: ['common'],
		defaultNS: 'common',
		resources: { en: { common: {} } },
		interpolation: { escapeValue: false },
	});
	testI18n = instance;
});

const Wrapper = ({ children }: { children: React.ReactNode }) => (
	<QueryClientProvider client={new QueryClient()}>
		<I18nextProvider i18n={testI18n}>
			<BrowserRouter>{children}</BrowserRouter>
		</I18nextProvider>
	</QueryClientProvider>
);

describe('CouponAssociationTable', () => {
	it('renders coupon name and code from loaded associations', async () => {
		render(
			<Wrapper>
				<CouponAssociationTable subscriptionId='sub_1' />
			</Wrapper>,
		);
		expect(await screen.findByText('Summer Sale')).toBeInTheDocument();
		expect(await screen.findByText('SUMMER20')).toBeInTheDocument();
	});

	it('shows Forever when end_date is absent', async () => {
		render(
			<Wrapper>
				<CouponAssociationTable subscriptionId='sub_1' />
			</Wrapper>,
		);
		expect(await screen.findByText('Forever')).toBeInTheDocument();
	});

	it('does not render Remove buttons when onRemove is not provided', async () => {
		render(
			<Wrapper>
				<CouponAssociationTable subscriptionId='sub_1' />
			</Wrapper>,
		);
		await screen.findByText('Summer Sale');
		expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument();
	});

	it('renders Remove button per row when onRemove is provided', async () => {
		const onRemove = vi.fn();
		render(
			<Wrapper>
				<CouponAssociationTable subscriptionId='sub_1' onRemove={onRemove} />
			</Wrapper>,
		);
		expect(await screen.findByRole('button', { name: /remove/i })).toBeInTheDocument();
	});
});
