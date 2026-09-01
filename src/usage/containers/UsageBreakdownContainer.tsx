//
// Dashboard-only data-fetching wrapper. NOT exported from the package — see `UsageBreakdown`.
// Shares the `['portal-analytics', analyticsParams]` React Query cache entry with
// `UsageTrendChartContainer` — rendering both in the same section costs one API call, not two.
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import CustomerPortalApi from '@/api/CustomerPortalApi';
import type { DashboardAnalyticsRequest } from '@/types';
import { adaptUsageBreakdownRows } from '../adapters';
import UsageBreakdown from '../components/UsageBreakdown';

interface UsageBreakdownContainerProps {
	analyticsParams: DashboardAnalyticsRequest;
	label?: string;
	className?: string;
}

const UsageBreakdownContainer = ({ analyticsParams, label, className }: UsageBreakdownContainerProps) => {
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
		if (isError) toast.error(t('errors.loadUsageBreakdown'));
	}, [isError, t]);

	const rows = adaptUsageBreakdownRows(analyticsData?.items ?? []);

	return <UsageBreakdown rows={rows} label={label} isLoading={isLoading} className={className} />;
};

export default UsageBreakdownContainer;
