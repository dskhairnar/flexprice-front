import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import { createInstance } from 'i18next';
import type { i18n as I18nInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import ApplyCouponDialog from './ApplyCouponDialog';

const { mockExecute } = vi.hoisted(() => ({
	mockExecute: vi.fn(),
}));

vi.mock('@/api/SubscriptionApi', () => ({
	default: { executeSubscriptionModify: mockExecute },
}));
vi.mock('@/api/CouponApi', () => ({
	default: {
		getAllCoupons: vi.fn().mockResolvedValue({
			items: [{ id: 'cpn_1', name: 'Summer Sale', coupon_code: 'SUMMER20', status: 'published', type: 'percentage' }],
			pagination: { limit: 200, offset: 0, total: 1 },
		}),
	},
}));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));
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
		ns: ['common', 'billing'],
		defaultNS: 'common',
		resources: {
			en: {
				common: {
					actions: { cancel: 'Cancel', apply: 'Apply' },
					selectUi: { selectAnOption: 'Select an option', noResultsFound: 'No results', noOptionsFound: 'No options' },
					search: { placeholderShort: 'Search…', searching: 'Searching…', errorLoadingOptions: 'Error loading options' },
				},
				billing: {
					subscriptions: {
						applyCouponDialog: {
							couponCodeLabel: 'Coupon',
							title: 'Apply Coupon',
							applyToLabel: 'Apply to',
							startDateOptional: 'Start date',
							endDateOptional: 'End date',
							pickStartDate: 'Pick start date',
							pickEndDate: 'Pick end date',
							couponCodePlaceholder: 'Search by name or code…',
							lineItemLabel: 'Line item',
							selectLineItemPlaceholder: 'Select a line item',
						},
					},
				},
			},
		},
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

describe('ApplyCouponDialog', () => {
	it('renders coupon search trigger and Apply button', () => {
		render(
			<Wrapper>
				<ApplyCouponDialog subscriptionId='sub_1' lineItems={[]} open={true} onOpenChange={vi.fn()} onSuccess={vi.fn()} />
			</Wrapper>,
		);
		// AsyncSearchableSelect renders a <button> trigger; scope Select is a separate control
		expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(2);
		expect(screen.getByRole('button', { name: /^apply$/i })).toBeInTheDocument();
	});

	it('Apply button is disabled when no coupon is selected', () => {
		render(
			<Wrapper>
				<ApplyCouponDialog subscriptionId='sub_1' lineItems={[]} open={true} onOpenChange={vi.fn()} onSuccess={vi.fn()} />
			</Wrapper>,
		);
		expect(screen.getByRole('button', { name: /^apply$/i })).toBeDisabled();
	});

	it('Cancel button calls onOpenChange(false)', () => {
		const onOpenChange = vi.fn();
		render(
			<Wrapper>
				<ApplyCouponDialog subscriptionId='sub_1' lineItems={[]} open={true} onOpenChange={onOpenChange} onSuccess={vi.fn()} />
			</Wrapper>,
		);
		screen.getByRole('button', { name: /cancel/i }).click();
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});
});
