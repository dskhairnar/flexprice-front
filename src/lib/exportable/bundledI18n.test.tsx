import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { createBundledT } from './bundledI18n';

const NAMESPACE = 'testWidgets';
const BUNDLED_RESOURCES = { title: 'Bundled Title', subtitle: 'Bundled Subtitle' };

const { useBoundT } = createBundledT(NAMESPACE, BUNDLED_RESOURCES);

async function hostWith(resources: Record<string, unknown> | undefined) {
	const i18n = createInstance();
	await i18n.use(initReactI18next).init({
		lng: 'en',
		fallbackLng: 'en',
		ns: resources ? [NAMESPACE] : ['other'],
		defaultNS: resources ? NAMESPACE : 'other',
		resources: resources ? { en: { [NAMESPACE]: resources } } : { en: { other: {} } },
		interpolation: { escapeValue: false },
	});
	return i18n;
}

describe('createBundledT / useBoundT', () => {
	it('uses the bundled default when the host has no i18n context at all', () => {
		const { result } = renderHook(() => useBoundT());
		expect(result.current('title')).toBe('Bundled Title');
	});

	it("uses the bundled default when the host doesn't have the namespace loaded", async () => {
		const i18n = await hostWith(undefined);
		const { result } = renderHook(() => useBoundT(), {
			wrapper: ({ children }) => <I18nextProvider i18n={i18n}>{children}</I18nextProvider>,
		});
		expect(result.current('title')).toBe('Bundled Title');
	});

	it('uses the host value when the host fully has the namespace', async () => {
		const i18n = await hostWith({ title: 'Host Title', subtitle: 'Host Subtitle' });
		const { result } = renderHook(() => useBoundT(), {
			wrapper: ({ children }) => <I18nextProvider i18n={i18n}>{children}</I18nextProvider>,
		});
		expect(result.current('title')).toBe('Host Title');
	});

	// Regression: the namespace-level `hasResourceBundle` check alone can't see that a host bundle
	// is missing individual keys — a widget shipped after the host's locale file was last updated.
	it('falls back to the bundled value per key when the host has the namespace but is missing that key', async () => {
		const i18n = await hostWith({ title: 'Host Title' }); // no `subtitle`
		const { result } = renderHook(() => useBoundT(), {
			wrapper: ({ children }) => <I18nextProvider i18n={i18n}>{children}</I18nextProvider>,
		});
		expect(result.current('title')).toBe('Host Title');
		expect(result.current('subtitle')).toBe('Bundled Subtitle');
		expect(result.current('subtitle')).not.toBe('testWidgets.subtitle');
	});
});
