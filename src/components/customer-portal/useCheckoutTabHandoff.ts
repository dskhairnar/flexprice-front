import { useEffect, useState } from 'react';
import { announceCheckoutReturn, consumeCheckoutReturnLoad } from './checkoutHandoff';

/** How long to wait for the browser to honour window.close() before giving up. */
const CLOSE_GRACE_MS = 800;

/**
 * On a provider redirect landing, hand the result to the tab the customer started
 * from and close this one.
 *
 * Returns true while the handoff is in flight so the caller can render nothing
 * rather than flashing a second copy of the portal — or, worse, the invalid-link
 * card — in a tab that is about to disappear.
 *
 * The close is only a request: browsers permit it for script-opened windows, and
 * this tab may instead be a link the customer opened themselves. If it is still
 * here after the grace period, the flag drops and the portal renders as usual.
 */
const useCheckoutTabHandoff = (): boolean => {
	// Read synchronously during the first render: an effect would let the page
	// paint before the marker is consumed.
	const [isHandingOff, setIsHandingOff] = useState(() => consumeCheckoutReturnLoad());

	useEffect(() => {
		if (!isHandingOff) return;
		announceCheckoutReturn();
		try {
			window.close();
		} catch {
			// Refused — fall through to the timer and render the portal instead.
		}
		const timer = window.setTimeout(() => setIsHandingOff(false), CLOSE_GRACE_MS);
		return () => window.clearTimeout(timer);
	}, [isHandingOff]);

	return isHandingOff;
};

export default useCheckoutTabHandoff;
