// Reusable bundled-i18n helper for exportable component libraries.
//
// Any component exported for external consumers can use this to render real translated strings
// out-of-the-box (bundled defaults) WITHOUT overriding a host app that ships its own i18n. The
// bundled instance is standalone — created via `createInstance()` and NEVER registered globally —
// so it can't disturb a host app's i18next. When a host provides an initialized i18n that can
// serve the given namespace bundle, the host's `t` wins; otherwise the bundled defaults are used.
import { createInstance, type TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

/**
 * Build a bundled translator bound to `namespace`, seeded with `resources` as its English bundle.
 * Returns `{ useBoundT }`: a hook returning the host `t` when the host i18n can serve `namespace`,
 * else a fixed `t` backed by the standalone bundled instance.
 */
export function createBundledT<N extends string>(namespace: N, resources: Record<string, unknown>): { useBoundT: () => TFunction<N> } {
	// A standalone instance — never registered globally, so it can't disturb a host app's i18n.
	const fallbackInstance = createInstance();
	fallbackInstance.init({
		lng: 'en',
		fallbackLng: 'en',
		ns: [namespace],
		defaultNS: namespace,
		resources: { en: { [namespace]: resources } },
		interpolation: { escapeValue: false },
	});
	const fallbackT = fallbackInstance.getFixedT('en', namespace) as unknown as TFunction<N>;

	/** `t` for the component: the host's when it can serve the `namespace` bundle, else bundled defaults. */
	function useBoundT(): TFunction<N> {
		const { t, i18n } = useTranslation(namespace);
		const hostCanServe =
			!!i18n && i18n.isInitialized && typeof i18n.hasResourceBundle === 'function' && i18n.hasResourceBundle(i18n.language, namespace);
		return hostCanServe ? (t as TFunction<N>) : fallbackT;
	}

	return { useBoundT };
}
