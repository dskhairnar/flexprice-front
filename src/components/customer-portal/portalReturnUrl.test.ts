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

	it('keeps other query parameters', () => {
		setUrl('https://portal.test/customer-portal?token=abc&tab=credits');
		expect(portalReturnUrl()).toContain('tab=credits');
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
