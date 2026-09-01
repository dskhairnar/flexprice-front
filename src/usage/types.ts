//
// Public presentational types for the usage widgets (quota, metric cards, trend chart, breakdown).
//
// Decoupled from backend DTOs (CustomerUsage / DashboardAnalyticsRequest / UsageAnalyticItem /
// GetDetailedCostAnalyticsResponse). Containers map API responses INTO these shapes via
// `adapters.ts`, so backend schema changes never leak into the widgets' public contract.

// ── UsageQuota ──────────────────────────────────────────────────────────────

export interface UsageQuotaItem {
	id: string;
	name: string;
	currentUsage: number;
	limit: number | null;
	isUnlimited: boolean;
}

export interface UsageQuotaProps {
	items: UsageQuotaItem[];
	label?: string;
	className?: string;
}

// ── MetricCards ──────────────────────────────────────────────────────────────

export interface MetricCardItem {
	id: string;
	titleKey: 'revenue' | 'cost' | 'margin' | 'marginPercent' | 'cpm' | 'custom';
	/** Only set when `titleKey` is `'custom'` — the item's own name from the API. */
	customLabel?: string;
	value: number;
	currency?: string;
	isPercent?: boolean;
	showChangeIndicator?: boolean;
	isNegative?: boolean;
}

export interface MetricCardsProps {
	metrics: MetricCardItem[];
	isLoading?: boolean;
	className?: string;
}

// ── UsageTrendChart ──────────────────────────────────────────────────────────

export interface UsageTrendPoint {
	timestamp: string;
	usage: number;
}

export interface UsageTrendSeries {
	id: string;
	name: string;
	points: UsageTrendPoint[];
}

export interface UsageTrendChartProps {
	series: UsageTrendSeries[];
	label?: string;
	isLoading?: boolean;
	className?: string;
}

// ── UsageBreakdown ──────────────────────────────────────────────────────────

export interface UsageBreakdownRow {
	id: string;
	name: string;
	groupId?: string;
	groupName?: string;
	totalUsage: number;
	totalUsageDisplay?: string;
	unit?: string;
	totalCost: number;
	currency?: string;
}

export interface UsageBreakdownProps {
	rows: UsageBreakdownRow[];
	label?: string;
	isLoading?: boolean;
	className?: string;
}
