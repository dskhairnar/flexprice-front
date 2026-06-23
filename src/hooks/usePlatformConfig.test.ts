import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

beforeEach(() => {
	vi.resetModules();
});

vi.mock('@/config/config', () => ({
	config: {
		platform: {
			apiReference: { enabled: true },
			sidebarDocumentation: { enabled: true },
			guides: { enabled: true },
			onboarding: { enabled: true },
		},
	},
}));

describe('usePlatformConfig', () => {
	it('enables all platform surfaces by default', async () => {
		const { usePlatformConfig } = await import('./usePlatformConfig');
		const { result } = renderHook(() => usePlatformConfig());
		expect(result.current.apiReferenceEnabled).toBe(true);
		expect(result.current.sidebarDocumentationEnabled).toBe(true);
		expect(result.current.guidesEnabled).toBe(true);
		expect(result.current.onboardingEnabled).toBe(true);
	});

	it('hides platform surfaces when config enabled is false', async () => {
		vi.doMock('@/config/config', () => ({
			config: {
				platform: {
					apiReference: { enabled: false },
					sidebarDocumentation: { enabled: false },
					guides: { enabled: false },
					onboarding: { enabled: false },
				},
			},
		}));

		const { isApiReferenceEnabled, isSidebarDocumentationEnabled, isGuidesEnabled, isOnboardingEnabled } =
			await import('./usePlatformConfig');
		expect(isApiReferenceEnabled()).toBe(false);
		expect(isSidebarDocumentationEnabled()).toBe(false);
		expect(isGuidesEnabled()).toBe(false);
		expect(isOnboardingEnabled()).toBe(false);
	});
});
