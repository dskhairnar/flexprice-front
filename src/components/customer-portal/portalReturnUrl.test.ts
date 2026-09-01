import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { portalReturnUrl, rememberSessionToken, recallSessionToken, forgetSessionToken } from './portalReturnUrl';

const setUrl = (href: string) => {
	Object.defineProperty(window, 'location', { configurable: true, value: new URL(href) });
};

describe('portalReturnUrl', () => {
	const original = window.location;

	beforeEach(() => localStorage.clear());
	afterEach(() => Object.defineProperty(window, 'location', { configurable: true, value: original }));

	// The token authenticates the portal session. Handing it to a payment provider
	// as a return URL puts it in their logs, the referrer chain and history.
	it('strips the session token from the return URL', () => {
		setUrl('https://portal.test/customer-portal?token=eyJhbGciOi.SECRET.sig');
		const url = portalReturnUrl();
		expect(url).not.toContain('token');
		expect(url).not.toContain('SECRET');
	});

	it('keeps the section the customer was on', () => {
		setUrl('https://portal.test/customer-portal?token=abc&section=credits');
		expect(portalReturnUrl()).toContain('section=credits');
	});

	// Providers append their own result parameters to the return URL. Building the
	// next one from the current URL carried those back, so the provider appended a
	// fresh pair beside them and the URL grew with every top-up:
	// ?id=…&state=succeeded&id=…&state=succeeded&…
	it("does not carry a provider's result parameters into the next return URL", () => {
		setUrl('https://portal.test/customer-portal?id=db4zjKau&state=succeeded&id=z513cdK0&state=succeeded&section=credits');

		const url = new URL(portalReturnUrl());

		expect(url.searchParams.getAll('id')).toEqual([]);
		expect(url.searchParams.getAll('state')).toEqual([]);
		// What we own still survives the trip.
		expect(url.searchParams.get('section')).toBe('credits');
		expect(url.searchParams.getAll('fp_checkout_return')).toEqual(['1']);
	});

	// An allowlist means an unrecognised parameter is dropped rather than trusted,
	// so nothing new can leak by being forgotten here.
	it('drops parameters it does not recognise', () => {
		setUrl('https://portal.test/customer-portal?token=abc&utm_source=email&session_id=cs_live_1');
		const url = portalReturnUrl();
		expect(url).not.toContain('utm_source');
		expect(url).not.toContain('session_id');
	});

	// localStorage, not sessionStorage: the provider tab is opened with noopener,
	// so it inherits no session storage and the return would find no token at all.
	it('round-trips the token across browsing contexts', () => {
		rememberSessionToken('tok_123');
		expect(recallSessionToken()).toBe('tok_123');
		expect(localStorage.getItem('flexprice.portal.sessionToken')).toBe('tok_123');
	});

	it('forgets the token on request', () => {
		rememberSessionToken('tok_123');
		forgetSessionToken();
		expect(recallSessionToken()).toBeNull();
	});

	it('returns null when nothing was stored', () => {
		expect(recallSessionToken()).toBeNull();
	});
});
