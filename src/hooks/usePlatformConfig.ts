import { config } from '@/config/config';

/** Empty-state tutorial cards on catalog/billing pages. */
export function isGuidesEnabled(): boolean {
	return config.platform.guides.enabled;
}

/** In-page API reference snippets and breadcrumb "API Docs" drawer. */
export function isApiReferenceEnabled(): boolean {
	return config.platform.apiReference.enabled;
}

/** Sidebar link to external documentation. */
export function isSidebarDocumentationEnabled(): boolean {
	return config.platform.sidebarDocumentation.enabled;
}

/** Post-signup tenant onboarding form and pricing setup routes. */
export function isOnboardingEnabled(): boolean {
	return config.platform.onboarding.enabled;
}

/** Resolves platform UI feature visibility from `config.platform` (see `VITE_PLATFORM_CONFIG`). */
export function usePlatformConfig() {
	return {
		apiReferenceEnabled: config.platform.apiReference.enabled,
		sidebarDocumentationEnabled: config.platform.sidebarDocumentation.enabled,
		guidesEnabled: config.platform.guides.enabled,
		onboardingEnabled: config.platform.onboarding.enabled,
	};
}
