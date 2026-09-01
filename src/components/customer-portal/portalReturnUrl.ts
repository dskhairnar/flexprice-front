/** Query parameter carrying the portal session token. */
const TOKEN_PARAM = 'token';

/** Where the token is kept so a return trip can restore it without the URL. */
const TOKEN_STORAGE_KEY = 'flexprice.portal.sessionToken';

/**
 * Remember the session token for the rest of this tab's life.
 *
 * The token arrives as a query parameter, which is fine for the first load but
 * cannot be handed to a payment provider as a return URL — see returnUrl below.
 * Session storage is tab-scoped and no more exposed than the URL already is.
 */
export const rememberSessionToken = (token: string) => {
	try {
		sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
	} catch {
		// Blocked storage: the customer keeps the URL token and simply loses the
		// ability to return from a hosted checkout.
	}
};

export const recallSessionToken = (): string | null => {
	try {
		return sessionStorage.getItem(TOKEN_STORAGE_KEY);
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
