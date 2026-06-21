import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
	default: {
		executeSubscriptionModify: mockExecute,
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
				common: { actions: { cancel: 'Cancel', back: 'Back', apply: 'Apply' } },
				billing: {
					subscriptions: {
						applyCouponDialog: {
							couponCodeLabel: 'Coupon Code',
							title: 'Apply Coupon',
							applyToLabel: 'Apply to',
							subscriptionLevel: 'Subscription level',
							lineItemLevel: 'Line item level',
							lineItemLabel: 'Line item',
							selectLineItemPlaceholder: 'Select a line item',
							startDateOptional: 'Start date (optional)',
							endDateOptional: 'End date (optional)',
							pickStartDate: 'Pick start date',
							pickEndDate: 'Pick end date',
							couponCodePlaceholder: 'Enter coupon code',
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
	it('renders coupon code input with Apply button', () => {
		render(
			<Wrapper>
				<ApplyCouponDialog subscriptionId='sub_1' lineItems={[]} open={true} onOpenChange={vi.fn()} onSuccess={vi.fn()} />
			</Wrapper>,
		);
		expect(screen.getByLabelText(/coupon code/i)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /apply/i })).toBeInTheDocument();
	});

	it('Apply button is disabled when coupon code is empty', () => {
		render(
			<Wrapper>
				<ApplyCouponDialog subscriptionId='sub_1' lineItems={[]} open={true} onOpenChange={vi.fn()} onSuccess={vi.fn()} />
			</Wrapper>,
		);
		expect(screen.getByRole('button', { name: /apply/i })).toBeDisabled();
	});

	it('calls executeSubscriptionModify with correct payload on Apply click', async () => {
		mockExecute.mockResolvedValue({});
		render(
			<Wrapper>
				<ApplyCouponDialog subscriptionId='sub_1' lineItems={[]} open={true} onOpenChange={vi.fn()} onSuccess={vi.fn()} />
			</Wrapper>,
		);
		fireEvent.change(screen.getByLabelText(/coupon code/i), { target: { value: 'SUMMER20' } });
		fireEvent.click(screen.getByRole('button', { name: /apply/i }));
		await waitFor(() => {
			expect(mockExecute).toHaveBeenCalledWith('sub_1', {
				type: 'coupon',
				coupon_params: expect.objectContaining({ action: 'add', coupon_code: 'SUMMER20' }),
			});
		});
	});
});
