import type { TFunction } from 'i18next';

/** Maps URL path segments to `common:sidebar.nav.*` or `common:breadcrumb.segments.*` keys. */
const SEGMENT_I18N_KEY: Record<string, string> = {
	home: 'sidebar.nav.home',
	'product-catalog': 'sidebar.nav.productCatalog',
	features: 'sidebar.nav.features',
	plan: 'sidebar.nav.plans',
	coupons: 'sidebar.nav.coupons',
	addons: 'sidebar.nav.addons',
	'cost-sheets': 'sidebar.nav.costSheets',
	'price-units': 'sidebar.nav.priceUnits',
	groups: 'sidebar.nav.groups',
	billing: 'sidebar.nav.billing',
	customers: 'sidebar.nav.customers',
	subscriptions: 'sidebar.nav.subscriptions',
	taxes: 'sidebar.nav.taxes',
	invoices: 'sidebar.nav.invoices',
	'credit-notes': 'sidebar.nav.creditNotes',
	payments: 'sidebar.nav.payments',
	analytics: 'sidebar.nav.revenue',
	revenue: 'sidebar.nav.revenue',
	tools: 'sidebar.nav.tools',
	'pricing-widget': 'sidebar.nav.pricingWidget',
	developers: 'sidebar.nav.developers',
	webhooks: 'sidebar.nav.webhooks',
	'api-keys': 'sidebar.nav.apiKeys',
	'service-accounts': 'sidebar.nav.serviceAccounts',
	workflows: 'sidebar.nav.workflows',
	integrations: 'sidebar.nav.integrations',
	'bulk-imports': 'sidebar.nav.imports',
	exports: 'sidebar.nav.exports',
	s3: 'sidebar.nav.exports',
	settings: 'sidebar.nav.settings',
	'create-feature': 'breadcrumb.segments.createFeature',
	'add-charges': 'breadcrumb.segments.addCharges',
	checkout: 'breadcrumb.segments.checkout',
	onboarding: 'breadcrumb.segments.onboarding',
	'pricing-setup': 'breadcrumb.segments.pricingSetup',
};

const ID_LIKE_SEGMENT = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isDynamicBreadcrumbSegment(segment: string): boolean {
	return ID_LIKE_SEGMENT.test(segment) || /^[a-z0-9_-]{24,}$/i.test(segment);
}

export function getBreadcrumbLabelForSegment(segment: string, t: TFunction<'common'>): string | undefined {
	const i18nKey = SEGMENT_I18N_KEY[segment];
	if (i18nKey) return t(i18nKey);
	return undefined;
}
