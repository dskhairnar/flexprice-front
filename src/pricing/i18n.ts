// Bundled i18n so the widget renders real English out-of-the-box for external consumers —
// WITHOUT overriding a host app that has its own i18n (the dashboard localizes these to Arabic).
//
// `usePricingT()`:
//   • host app has an initialized i18n with the `common` bundle  → use it (dashboard/white-label)
//   • otherwise (bare SDK consumer, no i18next)                  → bundled English fallback
import { createBundledT } from '@/lib/exportable/bundledI18n';

/** English defaults for the keys `PricingCard` renders (mirror of dashboard `common.pricingCard`). */
const EN_PRICING = {
	notIncluded: 'Not included',
	perBillingPeriod: ' per {{period}}',
	free: 'Free',
	plusUsage: '+ Usage',
	perPackage: '{{amount}} per package',
	perUnit: '{{amount}} per unit',
	startingAtPerUnit: 'Starting at {{amount}} per unit',
	compactPerPkg: '{{amount}}/pkg',
	compactFromPerUnit: 'from {{amount}}/unit',
	compactPerUnit: '{{amount}}/unit',
	volumePricing: 'Volume Pricing',
	unitsLabel: '{{range}} units',
	perUnitShort: '{{amount}} per unit',
	flatFeeShort: '+ {{amount}} flat fee',
	usageSectionModern: 'Usage',
	usageSectionClassic: 'Usage-based charges:',
	moreCount: '+{{count}} more',
	showLess: 'Show less',
	viewPlan: 'View plan',
	includedHeading: 'Included',
	addEntitlements: 'Add entitlements',
	creditsHeading: 'Credits',
	creditsAmount: '{{formatted}} credits',
	oneTime: 'one-time',
	recurring: 'recurring',
	previewBooleanNotIncluded: '{{name}} not included',
};

// Thin wrapper over the reusable `createBundledT` primitive (`@/lib/exportable/bundledI18n`).
// Namespace stays `'common'`: the dashboard localizes PricingCard via its `common` bundle (e.g.
// Arabic), and the bundled English lives under `common.pricingCard`. Changing the namespace would
// break the dashboard's host-i18n handoff.
export const usePricingT = createBundledT('common', { pricingCard: EN_PRICING }).useBoundT;
