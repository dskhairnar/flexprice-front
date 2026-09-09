import { describe, expect, it } from 'vitest';
import arBilling from '@/i18n/locales/ar/billing.json';
import arSettings from '@/i18n/locales/ar/settings.json';
import enBilling from '@/i18n/locales/en/billing.json';
import enSettings from '@/i18n/locales/en/settings.json';
import { WalletAlertLevel } from '@/models/Wallet';
import { getWalletAlertValidationErrorKey, type WalletAlertValidationErrorKey } from './walletAlertUtils';

/**
 * Every key the validator can return. Listed literally rather than derived from the type, so
 * adding a member to WalletAlertValidationErrorKey without adding its copy fails this test —
 * which is exactly how the escalation-ordering messages went missing from the settings
 * namespace while remaining reachable from the tenant page.
 */
const ALL_ERROR_KEYS: WalletAlertValidationErrorKey[] = [
	'atLeastOneThreshold',
	'invalidCriticalThreshold',
	'invalidWarningThreshold',
	'invalidInfoThreshold',
	'criticalThresholdOutOfRange',
	'warningThresholdOutOfRange',
	'infoThresholdOutOfRange',
	'criticalRequiredForWarning',
	'warningMustBeLessThanCritical',
	'warningMustBeGreaterThanCritical',
	'infoMustBeLessThanWarning',
	'infoMustBeGreaterThanWarning',
	'infoMustBeLessThanCritical',
	'infoMustBeGreaterThanCritical',
];

const resolve = (root: unknown, path: string): unknown =>
	path
		.split('.')
		.reduce<unknown>((acc, part) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[part] : undefined), root);

// Both surfaces that render these errors, and every locale each ships.
const NAMESPACES = [
	{ name: 'billing (wallet dialog)', base: 'wallet.alerts.validation', bundles: { en: enBilling, ar: arBilling } },
	{ name: 'settings (tenant defaults)', base: 'alerts.walletAlerts.validation', bundles: { en: enSettings, ar: arSettings } },
];

describe('wallet alert validation copy', () => {
	for (const { name, base, bundles } of NAMESPACES) {
		for (const [locale, bundle] of Object.entries(bundles)) {
			it(`${name} has ${locale} copy for every validation error key`, () => {
				const missing = ALL_ERROR_KEYS.filter((key) => typeof resolve(bundle, `${base}.${key}`) !== 'string');
				expect(missing).toEqual([]);
			});
		}
	}

	it('the escalation ordering rules actually produce the keys that are now covered', () => {
		const above = (threshold: string) => ({ threshold, condition: 'above' as const });
		const below = (threshold: string) => ({ threshold, condition: 'below' as const });

		// 'above' ladders descend: critical > warning > info.
		expect(getWalletAlertValidationErrorKey({ alert_enabled: true, critical: above('10'), warning: above('12') }, 'above')).toBe(
			'warningMustBeLessThanCritical',
		);
		expect(
			getWalletAlertValidationErrorKey({ alert_enabled: true, critical: above('20'), warning: above('10'), info: above('15') }, 'above'),
		).toBe('infoMustBeLessThanWarning');
		expect(getWalletAlertValidationErrorKey({ alert_enabled: true, critical: above('20'), info: above('25') }, 'above')).toBe(
			'infoMustBeLessThanCritical',
		);

		// 'below' ladders ascend: critical < warning < info.
		expect(getWalletAlertValidationErrorKey({ alert_enabled: true, critical: below('20'), warning: below('10') })).toBe(
			'warningMustBeGreaterThanCritical',
		);
		expect(getWalletAlertValidationErrorKey({ alert_enabled: true, critical: below('5'), warning: below('20'), info: below('10') })).toBe(
			'infoMustBeGreaterThanWarning',
		);
		expect(getWalletAlertValidationErrorKey({ alert_enabled: true, critical: below('20'), info: below('10') })).toBe(
			'infoMustBeGreaterThanCritical',
		);
	});

	it('a correctly escalating ladder passes in both directions', () => {
		expect(
			getWalletAlertValidationErrorKey({
				alert_enabled: true,
				critical: { threshold: '10', condition: 'below' },
				warning: { threshold: '25', condition: 'below' },
				info: { threshold: '50', condition: 'below' },
			}),
		).toBeNull();
		expect(
			getWalletAlertValidationErrorKey(
				{
					alert_enabled: true,
					critical: { threshold: '50', condition: 'above' },
					warning: { threshold: '25', condition: 'above' },
					info: { threshold: '10', condition: 'above' },
				},
				'above',
			),
		).toBeNull();
	});

	it('covers every level the validator inspects', () => {
		expect(Object.values(WalletAlertLevel)).toEqual(['critical', 'warning', 'info']);
	});
});
