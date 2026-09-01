import { useMemo } from 'react';
// Direct file import, NOT the '@/components/atoms' barrel — see UsageQuota.tsx for why.
import Card from '@/components/atoms/Card/Card';
import { Skeleton } from '@/components/ui/skeleton';
// Direct file import, NOT the `@/components/molecules` barrel — see MetricCards.tsx for why.
import CustomerUsageChart from '@/components/molecules/CustomerUsageChart';
import type { GetUsageAnalyticsResponse } from '@/types/dto';
import { cn } from '@/lib/utils';
import { useUsageT } from '../i18n';
import { normalizeUsageTrendSeries } from '../schema';
import type { UsageTrendChartProps } from '../types';

/**
 * Prop-only usage-trend line chart — no fetching, no auth, no PortalConfigContext. Internally
 * reuses the dashboard's `CustomerUsageChart` renderer (already token-based, no portal coupling)
 * and a decoupled `series` prop shape so the public contract never leaks the
 * `GetUsageAnalyticsResponse` backend DTO.
 *
 * `CustomerUsageChart` renders its own Card chrome (title included) in both its no-data and
 * has-data paths — this wrapper must not add a second one around it, or the widget renders
 * nested card borders/padding. The Card here is only for the loading-skeleton state, which
 * `CustomerUsageChart` has no prop for.
 */
const UsageTrendChart = ({ series: rawSeries, label, isLoading = false, className }: UsageTrendChartProps) => {
	const series = useMemo(() => normalizeUsageTrendSeries(rawSeries), [rawSeries]);
	const t = useUsageT();

	const chartData: GetUsageAnalyticsResponse = useMemo(
		() => ({
			total_cost: 0,
			currency: '',
			items: series.map((s) => ({
				feature_id: s.id,
				source: s.id,
				name: s.name,
				total_usage: 0,
				total_cost: 0,
				event_count: 0,
				points: s.points.map((p) => ({ timestamp: p.timestamp, usage: p.usage, cost: 0, event_count: 0 })),
			})),
		}),
		[series],
	);

	if (!isLoading && series.length === 0) return null;

	if (isLoading) {
		return (
			<Card noPadding className={cn('flexprice-ui', 'rounded-xl overflow-hidden bg-surface', className)}>
				<div className='p-6 border-b border-line'>
					<h3 className='text-base font-medium text-content'>{label || t('usageWidgets.trendTitle')}</h3>
				</div>
				<div className='p-6'>
					<div className='w-full h-64 flex flex-col gap-3 px-1'>
						<div className='flex flex-col justify-between h-52 relative'>
							{[...Array(5)].map((_, i) => (
								<div key={i} className='flex items-center gap-3 w-full'>
									<Skeleton className='h-3 w-8 shrink-0' />
									<div className='flex-1 h-px bg-line' />
								</div>
							))}
							<div className='absolute bottom-0 left-12 right-0 flex items-end gap-3 h-40'>
								{[35, 65, 45, 80, 55, 90, 40, 70, 50, 60].map((h, i) => (
									<Skeleton key={i} className='flex-1 rounded-sm' style={{ height: `${h}%` }} />
								))}
							</div>
						</div>
						<div className='flex justify-between ps-12'>
							{[0, 1, 2, 3].map((i) => (
								<Skeleton key={i} className='h-3 w-12' />
							))}
						</div>
					</div>
				</div>
			</Card>
		);
	}

	return <CustomerUsageChart data={chartData} title={label || t('usageWidgets.trendTitle')} className={cn('flexprice-ui', className)} />;
};

export default UsageTrendChart;
