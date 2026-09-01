import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import type { CheckoutStatus } from '@/types/dto/CustomerPortalBilling';

/** Stands in for the checkout resolving, so the dialog can be driven directly. */
let emit: (status: CheckoutStatus) => void = () => {};

vi.mock('../useCheckoutReturn', () => ({
	subscribeToCheckoutSettled: (onSettle: (status: CheckoutStatus) => void) => {
		emit = onSettle;
		return () => {
			emit = () => {};
		};
	},
}));

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

const { default: CheckoutLinkDialog } = await import('./CheckoutLinkDialog');

describe('CheckoutLinkDialog', () => {
	beforeEach(() => {
		emit = () => {};
	});

	// The customer pays in another tab and comes back to a refreshed balance with
	// "Complete your payment" still sitting over it.
	it('dismisses itself once the checkout completes', () => {
		const onOpenChange = vi.fn();
		render(<CheckoutLinkDialog url='https://pay.test/link' onOpenChange={onOpenChange} />);

		emit('completed');

		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	// Retrying is the obvious next move, so the link stays up.
	it('stays open when the checkout failed or expired', () => {
		const onOpenChange = vi.fn();
		render(<CheckoutLinkDialog url='https://pay.test/link' onOpenChange={onOpenChange} />);

		emit('failed');
		emit('expired');

		expect(onOpenChange).not.toHaveBeenCalled();
	});

	it('shows the link so a blocked redirect is not a dead end', () => {
		render(<CheckoutLinkDialog url='https://pay.test/link' onOpenChange={vi.fn()} />);
		expect(screen.getByText('https://pay.test/link')).toBeInTheDocument();
	});
});
