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

const { mockPreview, mockExecute } = vi.hoisted(() => ({
	mockPreview: vi.fn(),
	mockExecute: vi.fn(),
}));

vi.mock('@/api/SubscriptionApi', () => ({
	default: {
		previewSubscriptionModify: mockPreview,
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

describe('ApplyCouponDialog', () => {
	it('renders coupon code input in form step', () => {
		render(
			<Wrapper>
				<ApplyCouponDialog subscriptionId='sub_1' lineItems={[]} open={true} onOpenChange={vi.fn()} onSuccess={vi.fn()} />
			</Wrapper>,
		);
		expect(screen.getByLabelText(/coupon code/i)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /preview/i })).toBeInTheDocument();
	});

	it('calls previewSubscriptionModify with correct payload on Preview click', async () => {
		mockPreview.mockResolvedValue({ changed_resources: {} });
		render(
			<Wrapper>
				<ApplyCouponDialog subscriptionId='sub_1' lineItems={[]} open={true} onOpenChange={vi.fn()} onSuccess={vi.fn()} />
			</Wrapper>,
		);
		fireEvent.change(screen.getByLabelText(/coupon code/i), { target: { value: 'SUMMER20' } });
		fireEvent.click(screen.getByRole('button', { name: /preview/i }));
		await waitFor(() => {
			expect(mockPreview).toHaveBeenCalledWith('sub_1', {
				type: 'coupon',
				coupon_params: expect.objectContaining({ action: 'add', coupon_code: 'SUMMER20' }),
			});
		});
	});

	it('shows preview panel after successful preview call', async () => {
		mockPreview.mockResolvedValue({ changed_resources: { invoices: [] } });
		render(
			<Wrapper>
				<ApplyCouponDialog subscriptionId='sub_1' lineItems={[]} open={true} onOpenChange={vi.fn()} onSuccess={vi.fn()} />
			</Wrapper>,
		);
		fireEvent.change(screen.getByLabelText(/coupon code/i), { target: { value: 'TEST' } });
		fireEvent.click(screen.getByRole('button', { name: /preview/i }));
		expect(await screen.findByRole('button', { name: /apply/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
	});
});
