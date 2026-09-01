import type { TFunction } from 'i18next';

/** Logo asset per sync provider key, reusing the same assets as the Integrations page. */
export const MARKETPLACE_LOGO: Record<string, string> = {
	aws_marketplace: '/assets/logo/Marketplace-AWS.png',
	gcp_marketplace: '/assets/logo/google-cloud.png',
	azure_marketplace: '/assets/logo/Azure.png',
};

// Reuse the Integrations page's own catalog names instead of duplicating them, so the two pages
// can't drift apart.
const MARKETPLACE_LABEL_KEY: Record<string, string> = {
	aws_marketplace: 'insightsTools.integrations.catalog.aws_marketplace.name',
	gcp_marketplace: 'insightsTools.integrations.catalog.gcp_marketplace.name',
	azure_marketplace: 'insightsTools.integrations.catalog.azure_marketplace.name',
};

/** Localized display name for a sync provider key; falls back to the raw key for one this app doesn't recognize yet. */
export function getProviderLabel(t: TFunction<'settings'>, provider: string): string {
	const key = MARKETPLACE_LABEL_KEY[provider];
	return key ? t(key) : provider;
}
