import { config } from '@/config/config';
import { Locale } from '@/config/branding';
import { useLocaleStore } from '@/store/useLocaleStore';

/** Resolves documentation visibility from static config and active locale (Arabic hides docs). */
export function useDocumentationConfig() {
	const locale = useLocaleStore((s) => s.locale);
	const hideForArabic = locale === Locale.Ar;

	return {
		apiReferenceEnabled: config.documentation.apiReference.enabled && !hideForArabic,
		sidebarDocumentationEnabled: config.documentation.sidebarDocumentation.enabled && !hideForArabic,
		guidesEnabled: config.documentation.guides.enabled && !hideForArabic,
		onboardingEnabled: config.documentation.onboarding.enabled && !hideForArabic,
	};
}
