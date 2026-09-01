/** Query parameter carrying the portal session token. */
const TOKEN_PARAM = 'token';

/** Where the token is kept so a return trip can restore it without the URL. */
const TOKEN_STORAGE_KEY = 'flexprice.portal.sessionToken';

/**
 * Remember the session token so a return trip can restore it.
 *
 * localStorage, not sessionStorage: the provider is opened with
 * `noopener,noreferrer`, which starts a fresh browsing context that inherits no
 * session storage, and the customer is redirected back into *that* tab. A
 * tab-scoped token left the return landing with neither a URL token nor a stored
 * one, which the portal reads as an invalid link.
 *
 * Same-origin and no more exposed than the URL the token already arrives in.
 */
export const rememberSessionToken = (token: string) => {
	try {
		localStorage.setItem(TOKEN_STORAGE_KEY, token);
	} catch {
		// Blocked storage: the customer keeps the URL token and simply loses the
		// ability to return from a hosted checkout.
	}
};

/** Dropped once the session is no longer usable, so a stale token is not replayed. */
export const forgetSessionToken = () => {
	try {
		localStorage.removeItem(TOKEN_STORAGE_KEY);
	} catch {
		/* nothing to clear */
	}
};

export const recallSessionToken = (): string | null => {
	try {
		return localStorage.getItem(TOKEN_STORAGE_KEY);
	} catch {
		return null;
	}
};

/**
 * The URL a payment provider should send the customer back to.
 *
 * Deliberately not window.location.href: the portal authenticates from a
 * `token` query parameter, so the current URL carries the customer's session
 * token. Sending that as success_url hands the session to the provider, and from
 * there into its redirect logs, the referrer chain and browser history — anyone
 * holding the URL could act as that customer until it expires.
 *
 * The token is stripped and restored from session storage on return.
 */
export const portalReturnUrl = (): string => {
	try {
		const url = new URL(window.location.href);
		url.searchParams.delete(TOKEN_PARAM);
		return url.toString();
	} catch {
		return window.location.origin;
	}
};
