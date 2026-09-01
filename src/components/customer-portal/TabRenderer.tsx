import { lazy, Suspense } from 'react';
import { TabConfig, UsageGraphConfig } from '@/types/dto/PortalConfig';
import { DashboardAnalyticsRequest } from '@/types';
import { SubscriptionResponse } from '@/types/dto/Subscription';
import { CustomerUsage } from '@/models';
import { Loader } from '@/components/atoms';

// Lazy-load widgets — unused widgets don't bloat the bundle.
const SubscriptionsWidget = lazy(() => import('./widgets/SubscriptionsWidget'));
const UsageQuotaContainer = lazy(() => import('@/usage/containers/UsageQuotaContainer'));
const UsageTrendChartContainer = lazy(() => import('@/usage/containers/UsageTrendChartContainer'));
const UsageBreakdownContainer = lazy(() => import('@/usage/containers/UsageBreakdownContainer'));
const InvoicesWidget = lazy(() => import('./widgets/InvoicesWidget'));
const CreditBalanceContainer = lazy(() => import('@/credits/containers/CreditBalanceContainer'));
const CreditHistoryContainer = lazy(() => import('@/credits/containers/CreditHistoryContainer'));
const MetricCardsContainer = lazy(() => import('@/usage/containers/MetricCardsContainer'));

const FallbackLoader = () => (
	<div className='py-12'>
		<Loader />
	</div>
);

// Exported so SectionContent can fall back to the same defaults when a section has a
// metric_cards tab but no usage_graph tab to source date-filter config from.
export const DEFAULT_USAGE_GRAPH_CONFIG: UsageGraphConfig = {
	date_presets: ['last_7_days', 'last_30_days'],
	default_preset: 'last_7_days',
	allow_custom_date_range: false,
	feature_filter_mode: 'all',
};

interface TabRendererProps {
	tab: TabConfig;
	subscriptions?: SubscriptionResponse[];
	usageData?: CustomerUsage[];
	/**
	 * Resolved analytics params from SectionContent.
	 * Shared across all analytics widgets (metric_cards, usage_graph)
	 * so they hit the same React Query cache entry — zero duplicate API calls.
	 */
	analyticsParams: DashboardAnalyticsRequest;
}

/**
 * Maps tab.type to the correct lazily-loaded widget.
 * analyticsParams is always passed from SectionContent (which owns the date filter state).
 */
const TabRenderer = ({ tab, subscriptions = [], usageData, analyticsParams }: TabRendererProps) => {
	return (
		<Suspense fallback={<FallbackLoader />}>
			{tab.type === 'subscriptions' && <SubscriptionsWidget subscriptions={subscriptions} label={tab.label} />}
			{tab.type === 'current_usage' && <UsageQuotaContainer usageData={usageData} label={tab.label} />}
			{tab.type === 'usage_graph' && (
				<UsageTrendChartContainer
					config={tab.usage_graph ?? DEFAULT_USAGE_GRAPH_CONFIG}
					analyticsParams={analyticsParams}
					label={tab.label}
				/>
			)}
			{tab.type === 'usage_breakdown' && <UsageBreakdownContainer analyticsParams={analyticsParams} label={tab.label} />}
			{tab.type === 'invoices' && <InvoicesWidget />}
			{tab.type === 'wallet_balance' && <CreditBalanceContainer />}
			{tab.type === 'wallet_transactions' && <CreditHistoryContainer />}
			{tab.type === 'metric_cards' && <MetricCardsContainer analyticsParams={analyticsParams} config={tab.metric_cards} />}
		</Suspense>
	);
};

export default TabRenderer;
