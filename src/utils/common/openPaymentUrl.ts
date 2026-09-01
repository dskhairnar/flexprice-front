/**
 * Opens a payment link in a new tab, reporting whether the browser allowed it.
 *
 * Payment links are created by an API call, so the open happens in an async
 * callback rather than directly in the user's click — which is exactly what popup
 * blockers stop. Callers must therefore keep showing the URL so a blocked open
 * leaves the user able to continue by hand.
 */
export const openPaymentUrl = (url: string): boolean => {
	if (!url) return false;
	try {
		const opened = window.open(url, '_blank', 'noopener,noreferrer');
		return !!opened;
	} catch {
		return false;
	}
};
