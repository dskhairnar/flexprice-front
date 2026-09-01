import { describe, it, expect, vi, afterEach } from 'vitest';
import { openPaymentUrl } from './openPaymentUrl';

describe('openPaymentUrl', () => {
	afterEach(() => vi.restoreAllMocks());

	it('reports success when the browser allows the open', () => {
		vi.spyOn(window, 'open').mockReturnValue({} as Window);
		expect(openPaymentUrl('https://pay.test/link')).toBe(true);
	});

	// A popup blocker returns null rather than throwing. Callers rely on this to
	// know the user still needs the link surfaced.
	it('reports failure when a popup blocker returns null', () => {
		vi.spyOn(window, 'open').mockReturnValue(null);
		expect(openPaymentUrl('https://pay.test/link')).toBe(false);
	});

	it('reports failure when the browser throws instead', () => {
		vi.spyOn(window, 'open').mockImplementation(() => {
			throw new Error('blocked');
		});
		expect(openPaymentUrl('https://pay.test/link')).toBe(false);
	});

	it('does nothing without a url', () => {
		const open = vi.spyOn(window, 'open');
		expect(openPaymentUrl('')).toBe(false);
		expect(open).not.toHaveBeenCalled();
	});
});
