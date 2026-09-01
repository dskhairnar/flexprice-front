/**
 * Handing a finished checkout back to the tab the customer started from.
 *
 * A hosted checkout opens in a new tab, so the provider redirects *that* tab back
 * to the portal — leaving the customer looking at a second copy of their account
 * while the tab they came from sits behind it, still showing pre-payment numbers.
 *
 * On return the payment tab announces itself to the other tabs and closes. The
 * announcement carries no outcome: the original tab holds the checkout session id
 * and asks the API what happened, so a message forged by any same-origin page
 * cannot make the portal claim a payment succeeded.
 */

/** Marks a portal load as a provider redirect rather than a normal visit. */
export const CHECKOUT_RETURN_PARAM = 'fp_checkout_return';

const CHANNEL_NAME = 'flexprice.portal.checkout';

const openChannel = (): BroadcastChannel | null => {
	try {
		return typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(CHANNEL_NAME);
	} catch {
		return null;
	}
};

/** Tell any other portal tab that a checkout just came back. */
export const announceCheckoutReturn = () => {
	const channel = openChannel();
	if (!channel) return;
	try {
		channel.postMessage({ type: 'checkout-returned' });
	} finally {
		channel.close();
	}
};

/** Run `onReturn` when another tab comes back from a checkout. Returns an unsubscribe. */
export const subscribeToCheckoutReturn = (onReturn: () => void): (() => void) => {
	const channel = openChannel();
	if (!channel) return () => {};
	const handler = (event: MessageEvent) => {
		if (event.data?.type === 'checkout-returned') onReturn();
	};
	channel.addEventListener('message', handler);
	return () => {
		channel.removeEventListener('message', handler);
		channel.close();
	};
};

/**
 * True when this load is a provider redirect, having first stripped the marker.
 *
 * The parameter is removed before anything else runs so that a tab which cannot
 * close — the browser only permits it for script-opened windows, and the customer
 * may have reopened the link by hand — carries on as an ordinary portal page
 * instead of trying to hand off again on every reload.
 */
export const consumeCheckoutReturnLoad = (): boolean => {
	try {
		const url = new URL(window.location.href);
		if (!url.searchParams.has(CHECKOUT_RETURN_PARAM)) return false;
		url.searchParams.delete(CHECKOUT_RETURN_PARAM);
		window.history.replaceState(null, '', url.toString());
		return true;
	} catch {
		return false;
	}
};
