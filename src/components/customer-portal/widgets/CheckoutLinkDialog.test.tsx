import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import type { CheckoutStatus } from '@/types/dto/CustomerPortalBilling';

/** Stand-ins for the two signals, so the dialog can be driven directly. */
let emitSettled: (status: CheckoutStatus) => void = () => {};
let emitReturn: () => void = () => {};

vi.mock('../useCheckoutReturn', () => ({
	subscribeToCheckoutSettled: (onSettle: (status: CheckoutStatus) => void) => {
		emitSettled = onSettle;
		return () => {
			emitSettled = () => {};
		};
	},
}));

vi.mock('../checkoutHandoff', () => ({
	subscribeToCheckoutReturn: (onReturn: () => void) => {
		emitReturn = onReturn;
		return () => {
			emitReturn = () => {};
		};
	},
}));

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

const { default: CheckoutLinkDialog } = await import('./CheckoutLinkDialog');

describe('CheckoutLinkDialog', () => {
	beforeEach(() => {
		emitSettled = () => {};
		emitReturn = () => {};
	});

	// The customer pays in another tab and comes back to a refreshed balance with
	// "Complete your payment" still sitting over it.
	it('dismisses itself once the checkout completes', () => {
		const onOpenChange = vi.fn();
		render(<CheckoutLinkDialog url='https://pay.test/link' onOpenChange={onOpenChange} />);

		emitSettled('completed');

		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	// The outcome only arrives while the page is still polling, and it gives up
	// after ~40s — easily less than a customer spends on the provider's page. The
	// return announcement always arrives, so it closes the dialog on its own.
	it('dismisses itself when the customer returns, even with no outcome', () => {
		const onOpenChange = vi.fn();
		render(<CheckoutLinkDialog url='https://pay.test/link' onOpenChange={onOpenChange} />);

		emitReturn();

		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	// A failed outcome on its own is not a reason to take the link away — the
	// customer never left, and retrying it is the obvious next move.
	it('stays open on a failed outcome with no return', () => {
		const onOpenChange = vi.fn();
		render(<CheckoutLinkDialog url='https://pay.test/link' onOpenChange={onOpenChange} />);

		emitSettled('failed');
		emitSettled('expired');

		expect(onOpenChange).not.toHaveBeenCalled();
	});

	it('shows the link so a blocked redirect is not a dead end', () => {
		render(<CheckoutLinkDialog url='https://pay.test/link' onOpenChange={vi.fn()} />);
		expect(screen.getByText('https://pay.test/link')).toBeInTheDocument();
	});
});
