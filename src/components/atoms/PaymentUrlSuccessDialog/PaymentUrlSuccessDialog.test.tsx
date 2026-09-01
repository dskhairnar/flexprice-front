import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import enCommon from '@/i18n/locales/en/common.json';
import PaymentUrlSuccessDialog from './PaymentUrlSuccessDialog';

// Rendering through the real locale file also asserts the new keys resolve.
const renderDialog = (props: Partial<Parameters<typeof PaymentUrlSuccessDialog>[0]> = {}) => {
	const i18n = createInstance();
	i18n.init({
		lng: 'en',
		fallbackLng: 'en',
		ns: ['common'],
		defaultNS: 'common',
		resources: { en: { common: enCommon } },
		interpolation: { escapeValue: false },
	});
	return render(
		<I18nextProvider i18n={i18n}>
			<PaymentUrlSuccessDialog
				isOpen
				paymentUrl={URL}
				isCopied={false}
				onClose={vi.fn()}
				onCopyUrl={vi.fn()}
				onGoToLink={vi.fn()}
				{...props}
			/>
		</I18nextProvider>,
	);
};

const URL = 'https://pay.test/checkout/abc123';

describe('PaymentUrlSuccessDialog', () => {
	// Regression: the component took paymentUrl but never rendered it, so a blocked
	// popup left the user with no way to reach the payment page.
	it('renders the payment link so a blocked popup is recoverable', () => {
		renderDialog();
		expect(screen.getByText(URL)).toBeInTheDocument();
	});

	it('tells the user what to do when the page did not open', () => {
		renderDialog();
		expect(screen.getByText(/copy this link and open it in a new tab/i)).toBeInTheDocument();
	});

	it('offers both opening and copying the link', () => {
		renderDialog();
		expect(screen.getByRole('button', { name: /go to payment link/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /get link/i })).toBeInTheDocument();
	});
});
