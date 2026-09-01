//
// Dashboard-only data-fetching wrapper. NOT exported from the package — see `UsageTrendChart`.
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import CustomerPortalApi from '@/api/CustomerPortalApi';
import type { DashboardAnalyticsRequest } from '@/types';
import type { UsageGraphConfig } from '@/types/dto/PortalConfig';
import { adaptUsageTrendSeries } from '../adapters';
import UsageTrendChart from '../components/UsageTrendChart';
import type { EmptyStateAction } from '../types';

interface UsageTrendChartContainerProps {
	config: UsageGraphConfig;
	analyticsParams: DashboardAnalyticsRequest;
	label?: string;
	className?: string;
	periodLabel?: string;
	emptyAction?: EmptyStateAction;
}

const UsageTrendChartContainer = ({
	config,
	analyticsParams,
	label,
	className,
	periodLabel,
	emptyAction,
}: UsageTrendChartContainerProps) => {
	const { t } = useTranslation('customer-portal');
	const {
		data: analyticsData,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['portal-analytics', analyticsParams],
		queryFn: () => CustomerPortalApi.getAnalytics(analyticsParams),
	});

	useEffect(() => {
		if (isError) toast.error(t('errors.loadUsageAnalytics'));
	}, [isError, t]);

	const series = adaptUsageTrendSeries(analyticsData?.items ?? [], config);

	return (
		<UsageTrendChart
			series={series}
			label={label}
			isLoading={isLoading}
			className={className}
			periodLabel={periodLabel}
			emptyAction={emptyAction}
		/>
	);
};

export default UsageTrendChartContainer;
