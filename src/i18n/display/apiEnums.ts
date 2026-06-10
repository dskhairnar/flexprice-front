import type { TFunction } from 'i18next';
import i18n from 'i18next';

/** Converts API enum codes (MONTHLY, half_yearly, delegated_invoicing) to i18n key segments. */
export function apiEnumCodeToSegment(code: string): string {
	const parts = code
		.trim()
		.split(/[_\s]+/)
		.filter(Boolean);
	if (parts.length === 0) return '';
	return parts
		.map((part, index) => (index === 0 ? part.toLowerCase() : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()))
		.join('');
}

function humanizeApiEnumCode(code: string): string {
	return code
		.split(/[_\s]+/)
		.filter(Boolean)
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
		.join(' ');
}

type PrefixEnumConfig = { kind: 'prefix'; key: string };
type MappedEnumConfig = { kind: 'map'; keys: Record<string, string> };

export type ApiEnumConfig = PrefixEnumConfig | MappedEnumConfig;

/** Registry: reuse existing locale keys — no parallel enum trees. */
export const ApiEnum = {
	billingPeriod: { kind: 'prefix', key: 'billing:subscriptions.listPage.billingPeriod' },
	billingPeriodUnit: { kind: 'prefix', key: 'common:apiEnums.billingPeriodUnit' },
	invoiceCadence: {
		kind: 'map',
		keys: {
			ADVANCE: 'catalog:plans.organisms.recurringForm.invoiceCadenceAdvance',
			ARREAR: 'catalog:plans.organisms.recurringForm.invoiceCadenceArrear',
		},
	},
	priceType: {
		kind: 'map',
		keys: {
			FIXED: 'catalog:plans.organisms.setupCharges.subscriptionTypeFixed',
			USAGE: 'catalog:plans.organisms.setupCharges.subscriptionTypeUsage',
		},
	},
	billingModel: {
		kind: 'map',
		keys: {
			FLAT_FEE: 'catalog:priceDialogs.billingModels.flatFee',
			PACKAGE: 'catalog:priceDialogs.billingModels.package',
			TIERED: 'catalog:priceDialogs.billingModels.volumeTiered',
			SLAB_TIERED: 'catalog:priceDialogs.billingModels.slabTiered',
		},
	},
	entityStatus: {
		kind: 'map',
		keys: {
			PUBLISHED: 'common:status.active',
			ARCHIVED: 'common:status.inactive',
			DELETED: 'common:status.inactive',
		},
	},
	subscriptionType: { kind: 'prefix', key: 'common:apiEnums.subscriptionType' },
	tierMode: { kind: 'prefix', key: 'common:apiEnums.tierMode' },
	/** RBAC role codes from API (e.g. super_admin). */
	rbacRole: { kind: 'prefix', key: 'common:apiEnums.rbacRole' },
} as const satisfies Record<string, ApiEnumConfig>;

/** Localized label for API RBAC role strings (super_admin, admin, …). */
export function formatRbacRole(role: string, t?: TFunction): string {
	const translator = t ?? i18n.getFixedT(i18n.language ?? 'en', 'common');
	return translateApiEnum(translator, ApiEnum.rbacRole, role);
}

export function translateApiEnum(
	t: TFunction,
	config: ApiEnumConfig,
	code: string | null | undefined,
	options?: { fallback?: string },
): string {
	if (!code?.trim()) return options?.fallback ?? '--';

	const normalized = code.trim();
	const fallback = options?.fallback ?? humanizeApiEnumCode(normalized);

	if (config.kind === 'map') {
		const i18nKey = config.keys[normalized.toUpperCase()] ?? config.keys[normalized.toLowerCase()];
		if (i18nKey) return t(i18nKey, { defaultValue: fallback });
		return fallback;
	}

	const segment = apiEnumCodeToSegment(normalized);
	return t(`${config.key}.${segment}`, { defaultValue: fallback });
}
