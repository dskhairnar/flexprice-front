import { useQuery } from '@tanstack/react-query';
import type { CustomerUsage } from '@/models';
import CustomerPortalApi from '@/api/CustomerPortalApi';
import { adaptUsageQuotaItems } from '../adapters';
import UsageQuota from '../components/UsageQuota';

interface UsageQuotaContainerProps {
	/** Pre-fetched by a parent (e.g. `SectionContent`) sharing the `['portal-usage']` cache entry. */
	usageData?: CustomerUsage[];
	label?: string;
	className?: string;
}

const UsageQuotaContainer = ({ usageData, label, className }: UsageQuotaContainerProps) => {
	const { data } = useQuery({
		queryKey: ['portal-usage'],
		queryFn: () => CustomerPortalApi.getUsageSummary(),
		enabled: usageData === undefined,
	});

	const items = adaptUsageQuotaItems(usageData ?? data?.features ?? []);

	return <UsageQuota items={items} label={label} className={className} />;
};

export default UsageQuotaContainer;
