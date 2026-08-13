import i18n, { type i18n as I18nInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { NAMESPACES } from '../src/i18n';

/**
 * Storybook's i18next bootstrap.
 *
 * The app's `initI18n` (src/i18n/index.ts) is async — it lazy-loads namespace bundles through
 * `i18next-resources-to-backend`. Storybook decorators are synchronous, so a story would mount and
 * render raw keys ("queryBuilder.sort") for a frame or two, or forever if the bundle never resolved.
 *
 * Here every locale bundle is pulled in eagerly at module-evaluation time instead, so `t` resolves
 * real strings on the very first render. This is a dev-only bundle; the size cost never ships.
 */
const modules = import.meta.glob<{ default: Record<string, unknown> }>('../src/i18n/locales/*/*.json', { eager: true });

const resources: Record<string, Record<string, Record<string, unknown>>> = {};

for (const [path, module] of Object.entries(modules)) {
	// '../src/i18n/locales/en/common.json' -> ['en', 'common']
	const match = /\/locales\/([^/]+)\/([^/]+)\.json$/.exec(path);
	if (!match) continue;
	const [, language, namespace] = match;
	resources[language] ??= {};
	resources[language][namespace] = module.default;
}

export const AVAILABLE_LOCALES = Object.keys(resources).sort();

// Mirrors RTL_LOCALES in src/config/branding.ts. Kept as a plain literal so the Storybook bootstrap
// doesn't pull the branding module (and its `import.meta.env` reads) into the preview bundle.
const RTL_LOCALES = new Set(['ar', 'he', 'fa', 'ur']);

export const directionFor = (locale: string): 'ltr' | 'rtl' => (RTL_LOCALES.has(locale) ? 'rtl' : 'ltr');

if (!i18n.isInitialized) {
	i18n.use(initReactI18next).init({
		lng: 'en',
		fallbackLng: 'en',
		defaultNS: 'common',
		ns: [...NAMESPACES],
		resources,
		interpolation: { escapeValue: false },
		// Storybook is where missing keys should be loud, not silently swallowed.
		saveMissing: false,
		react: { useSuspense: false },
	});
}

export const storybookI18n: I18nInstance = i18n;
