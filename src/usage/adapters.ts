//
// Pure DTO → presentational mapping for the usage widgets. No React, no hooks — independently
// unit-testable. Containers call these to turn API responses into the usage widgets' typed
// presentational models. Mirrors `src/pricing/adapters.ts`.
import { FEATURE_TYPE } from '@/models/Feature';
import type { CustomerUsage, UsageAnalyticItem } from '@/models';
import type { GetDetailedCostAnalyticsResponse } from '@/types/dto/Cost';
import type { CustomAnalyticItem } from '@/types/dto/Events';
import type { MetricCardsConfig, UsageGraphConfig } from '@/types/dto/PortalConfig';
import type { UsageQuotaItem, MetricCardItem, UsageTrendSeries, UsageBreakdownRow } from './types';

/** Metered-usage entitlements only — static/boolean entitlements have no quota to show. */
export function adaptUsageQuotaItems(usageData: CustomerUsage[] | undefined): UsageQuotaItem[] {
	return (usageData ?? [])
		.filter((item) => item.feature?.type === FEATURE_TYPE.METERED)
		.map((item, index) => ({
			id: item.feature?.id || String(index),
			name: item.feature?.name || '',
			currentUsage: Number(item.current_usage || 0),
			limit: item.is_unlimited ? null : item.total_limit != null ? Number(item.total_limit) : null,
			isUnlimited: item.is_unlimited,
		}));
}

// ── MetricCards ──────────────────────────────────────────────────────────────

export function adaptMetricCards(
	costData: GetDetailedCostAnalyticsResponse | undefined,
	customItems: CustomAnalyticItem[],
	config: MetricCardsConfig,
): MetricCardItem[] {
	const items: MetricCardItem[] = [];
	const currency = costData?.currency ?? 'USD';

	if (config.show_revenue_metric && costData) {
		items.push({ id: 'revenue', titleKey: 'revenue', value: parseFloat(costData.total_revenue), currency });
	}
	if (config.show_cost_metrics && costData) {
		const margin = parseFloat(costData.margin);
		const marginPercent = parseFloat(costData.margin_percent);
		items.push({ id: 'cost', titleKey: 'cost', value: parseFloat(costData.total_cost), currency });
		items.push({ id: 'margin', titleKey: 'margin', value: margin, currency, showChangeIndicator: true, isNegative: margin < 0 });
		items.push({
			id: 'margin-percent',
			titleKey: 'marginPercent',
			value: marginPercent,
			isPercent: true,
			showChangeIndicator: true,
			isNegative: marginPercent < 0,
		});
	}
	if (config.show_custom_metrics) {
		for (const item of customItems ?? []) {
			const value = parseFloat(item.value);
			const isCpm = item.id === 'revenue-per-minute' || item.name === 'revenue-per-minute';
			items.push({
				id: item.id,
				titleKey: isCpm ? 'cpm' : 'custom',
				customLabel: item.name,
				value: isNaN(value) ? 0 : value,
				currency: isCpm ? currency : undefined,
			});
		}
	}
	return items;
}

// ── UsageTrendChart ──────────────────────────────────────────────────────────

/** Applies the portal's feature_filter_mode config, then maps to the decoupled series shape. */
export function adaptUsageTrendSeries(
	items: UsageAnalyticItem[],
	config: Pick<UsageGraphConfig, 'feature_filter_mode' | 'feature_ids'>,
): UsageTrendSeries[] {
	const { feature_filter_mode, feature_ids } = config;
	let filtered = items ?? [];
	if (feature_filter_mode === 'include_list' && feature_ids?.length) {
		filtered = filtered.filter((item) => feature_ids.includes(item.feature_id));
	} else if (feature_filter_mode === 'exclude_list' && feature_ids?.length) {
		filtered = filtered.filter((item) => !feature_ids.includes(item.feature_id));
	}
	return filtered.map((item, index) => ({
		id: item.source || item.feature_id || `series-${index}`,
		name: item.name || item.event_name || '',
		points: (item.points ?? []).map((p) => ({ timestamp: p.timestamp, usage: p.usage })),
	}));
}

// ── UsageBreakdown ──────────────────────────────────────────────────────────

export function adaptUsageBreakdownRows(items: UsageAnalyticItem[]): UsageBreakdownRow[] {
	return (items ?? []).map((row, index) => {
		const group = row.group ?? row.feature?.group ?? row.price?.group;
		// Singular/plural must key off the value actually shown, not the raw metered total: when
		// `reporting_unit.conversion_rate` is set, `total_usage_display` can read "1" while raw
		// `total_usage` is e.g. 1000 — plural would be wrong for what the user sees.
		const displayQuantity =
			row.total_usage_display != null ? parseFloat(row.total_usage_display.replace(/,/g, '')) : Number(row.total_usage);
		const isSingular = Number.isFinite(displayQuantity) ? displayQuantity === 1 : Number(row.total_usage) === 1;
		const unitLabel = row.reporting_unit
			? isSingular
				? (row.reporting_unit.unit_singular ?? row.reporting_unit.unit_plural ?? '')
				: (row.reporting_unit.unit_plural ?? row.reporting_unit.unit_singular ?? '')
			: row.unit
				? isSingular
					? row.unit
					: (row.unit_plural ?? row.unit)
				: undefined;
		return {
			id: row.feature_id || row.price_id || row.meter_id || String(index),
			name: row.name || row.feature?.name || row.event_name || '',
			groupId: group?.id,
			groupName: group?.name,
			totalUsage: Number(row.total_usage) || 0,
			totalUsageDisplay: row.total_usage_display || undefined,
			unit: unitLabel,
			totalCost: Number(row.total_cost) || 0,
			currency: row.currency,
		};
	});
}
