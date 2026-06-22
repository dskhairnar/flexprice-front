import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { Locale } from '@/config/branding';

beforeEach(() => {
	vi.resetModules();
	localStorage.clear();
});

vi.mock('i18next', () => ({
	default: { changeLanguage: vi.fn() },
}));

vi.mock('@/config/config', () => ({
	config: {
		i18n: { locale: 'en', direction: 'ltr' },
		allowedLocales: ['en', 'ar'],
		documentation: {
			apiReference: { enabled: true },
			sidebarDocumentation: { enabled: true },
			guides: { enabled: true },
			onboarding: { enabled: true },
		},
	},
}));

describe('useDocumentationConfig', () => {
	it('enables both documentation surfaces by default', async () => {
		const { useDocumentationConfig } = await import('./useDocumentationConfig');
		const { result } = renderHook(() => useDocumentationConfig());
		expect(result.current.apiReferenceEnabled).toBe(true);
		expect(result.current.sidebarDocumentationEnabled).toBe(true);
		expect(result.current.guidesEnabled).toBe(true);
		expect(result.current.onboardingEnabled).toBe(true);
	});

	it('disables both documentation surfaces for Arabic locale', async () => {
		const { useLocaleStore } = await import('@/store/useLocaleStore');
		act(() => useLocaleStore.getState().setLocale(Locale.Ar));

		const { useDocumentationConfig } = await import('./useDocumentationConfig');
		const { result } = renderHook(() => useDocumentationConfig());
		expect(result.current.apiReferenceEnabled).toBe(false);
		expect(result.current.sidebarDocumentationEnabled).toBe(false);
		expect(result.current.guidesEnabled).toBe(false);
		expect(result.current.onboardingEnabled).toBe(false);
	});
});
