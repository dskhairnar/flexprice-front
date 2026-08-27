import { ActionButton, Page } from '@/components/atoms';
import { ColumnData, RedirectCell } from '@/components/molecules';
import { QueryableDataArea } from '@/components/organisms';
import UsageRecordApi from '@/api/UsageRecordApi';
import CustomerApi from '@/api/CustomerApi';
import { PlanApi } from '@/api/PlanApi';
import { RouteNames } from '@/core/routes/Routes';
import { UsageRecord } from '@/models';
import { FilterOperator, DataType } from '@/types/common/QueryBuilder';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { formatDateTime } from '@/utils/common/format_date';
import { validateResponseItems, usageRecordItemSchema } from '@/hooks/usageRecordSchemas';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import UsageRecordSyncsDrawer from './UsageRecordSyncsDrawer';
import { MARKETPLACE_LOGO, getProviderLabel } from './marketplaceProviders';
import {
	getUsageSyncsFilterOptions,
	getUsageSyncsSortOptions,
	getUsageSyncsInitialSorts,
	usageSyncsInitialFilters,
} from './usageSyncsQueryConfig';

const USAGE_SYNCS_PAGE_SIZE = 10;

/** Usage record with customer/plan names resolved in the fetch (same pattern as EnrichedInvoice). */
type EnrichedUsageRecord = UsageRecord & {
	customer_name?: string;
	plan_name?: string;
};

async function fetchCustomerNames(ids: string[]): Promise<Record<string, string>> {
	if (ids.length === 0) return {};
	const res = await CustomerApi.getCustomersByFilters({
		customer_ids: ids,
		limit: ids.length,
		offset: 0,
		filters: [],
		sort: [],
	});
	const map: Record<string, string> = {};
	res.items?.forEach((c) => {
		map[c.id] = c.name;
	});
	return map;
}

async function fetchPlanNames(ids: string[]): Promise<Record<string, string>> {
	if (ids.length === 0) return {};
	const res = await PlanApi.getPlansByFilter({
		filters: [{ field: 'id', operator: FilterOperator.IN, data_type: DataType.ARRAY, value: { array: ids } }],
		limit: ids.length,
		offset: 0,
		sort: [],
	});
	const map: Record<string, string> = {};
	res.items?.forEach((p) => {
		map[p.id] = p.name;
	});
	return map;
}

const UsageSyncs = () => {
	const { t } = useTranslation('settings');
	const [activeRecord, setActiveRecord] = useState<UsageRecord | null>(null);
	const [drawerOpen, setDrawerOpen] = useState(false);

	const filterOptions = useMemo(() => getUsageSyncsFilterOptions(t), [t]);
	const sortOptions = useMemo(() => getUsageSyncsSortOptions(t), [t]);
	const initialSorts = useMemo(() => getUsageSyncsInitialSorts(t), [t]);

	const enrichedFetchFn = useCallback(async (params: { limit: number; offset: number; filters: unknown[]; sort: unknown[] }) => {
		const result = await UsageRecordApi.searchUsageRecords({
			limit: params.limit,
			offset: params.offset,
			filters: params.filters as never,
			sort: params.sort as never,
		});
		// The schema validates every dereferenced field (and each syncs entry), so
		// its output is a fully-formed UsageRecord — no assertion needed.
		const rawItems: UsageRecord[] = validateResponseItems(usageRecordItemSchema, result, 'usageRecords');
		const customerIds = [...new Set(rawItems.map((item) => item.customer_id).filter(Boolean))];
		const planIds = [...new Set(rawItems.map((item) => item.plan_id).filter(Boolean))];
		const [customerNameById, planNameById] = await Promise.all([fetchCustomerNames(customerIds), fetchPlanNames(planIds)]);
		const items: EnrichedUsageRecord[] = rawItems.map((item) => ({
			...item,
			customer_name: customerNameById[item.customer_id],
			plan_name: planNameById[item.plan_id],
		}));
		return { items, pagination: result.pagination };
	}, []);

	const columns: ColumnData<EnrichedUsageRecord>[] = useMemo(
		() => [
			{
				title: t('insightsTools.usageSyncs.columns.subscription'),
				render: (row) => (
					<RedirectCell redirectUrl={`${RouteNames.customers}/${row.customer_id}/subscription/${row.subscription_id}`}>
						<span className='truncate max-w-[140px] inline-block align-bottom'>{row.subscription_id}</span>
					</RedirectCell>
				),
			},
			{
				title: t('insightsTools.usageSyncs.columns.customer'),
				render: (row) => (
					<RedirectCell redirectUrl={`${RouteNames.customers}/${row.customer_id}`}>
						<span className='truncate max-w-[160px] inline-block align-bottom'>{row.customer_name || row.customer_external_id}</span>
					</RedirectCell>
				),
			},
			{
				title: t('insightsTools.usageSyncs.columns.plan'),
				render: (row) => (
					<RedirectCell redirectUrl={`${RouteNames.plan}/${row.plan_id}`}>
						<span className='truncate max-w-[160px] inline-block align-bottom'>{row.plan_name || row.plan_id}</span>
					</RedirectCell>
				),
			},
			{
				title: t('insightsTools.usageSyncs.columns.amount'),
				render: (row) => `${getCurrencySymbol(row.currency)}${row.amount}`,
			},
			{
				title: t('insightsTools.usageSyncs.columns.currency'),
				render: (row) => row.currency?.toUpperCase(),
			},
			{
				title: t('insightsTools.usageSyncs.columns.periodStart'),
				render: (row) => formatDateTime(row.period_start),
			},
			{
				title: t('insightsTools.usageSyncs.columns.periodEnd'),
				render: (row) => formatDateTime(row.period_end),
			},
			{
				title: t('insightsTools.usageSyncs.columns.syncs'),
				fieldVariant: 'interactive',
				render: (row) => {
					const providers = Object.keys(row.syncs ?? {});
					return (
						<button
							type='button'
							className='inline-flex items-center gap-1.5'
							onClick={(e) => {
								e.stopPropagation();
								setActiveRecord(row);
								setDrawerOpen(true);
							}}>
							{providers.length === 0 ? (
								<span className='text-sm text-gray-400'>{t('insightsTools.usageSyncs.notSynced')}</span>
							) : (
								providers.map((provider) => {
									const logo = MARKETPLACE_LOGO[provider];
									const label = getProviderLabel(t, provider);
									return logo ? (
										<img
											key={provider}
											src={logo}
											alt={label}
											title={label}
											className='h-5 w-5 rounded border border-gray-200 bg-white object-contain p-0.5'
										/>
									) : (
										<span key={provider} className='text-xs text-gray-500'>
											{label}
										</span>
									);
								})
							)}
						</button>
					);
				},
			},
			{
				fieldVariant: 'interactive',
				hideOnEmpty: true,
				render: (row) => (
					<ActionButton
						id={row.id}
						copyId={{ entityType: t('insightsTools.usageSyncs.entityName') }}
						deleteMutationFn={async () => {}}
						refetchQueryKey='usageRecords'
						entityName={t('insightsTools.usageSyncs.entityName')}
						disableToast={true}
						edit={{ enabled: false }}
						archive={{ enabled: false }}
					/>
				),
			},
		],
		[t],
	);

	return (
		<Page heading={t('insightsTools.usageSyncs.pageHeading')}>
			<UsageRecordSyncsDrawer record={activeRecord} isOpen={drawerOpen} onOpenChange={setDrawerOpen} />

			<QueryableDataArea<EnrichedUsageRecord>
				queryConfig={{
					filterOptions,
					sortOptions,
					initialFilters: usageSyncsInitialFilters,
					initialSorts,
					debounceTime: 300,
					filterPersistenceKey: 'usageRecords',
				}}
				dataConfig={{
					queryKey: 'usageRecords',
					fetchFn: enrichedFetchFn,
					probeFetchFn: async (params) =>
						UsageRecordApi.searchUsageRecords({
							...params,
							limit: 1,
							offset: 0,
							filters: [],
							sort: [],
						}),
				}}
				tableConfig={{
					columns,
					showEmptyRow: true,
				}}
				paginationConfig={{
					unit: t('insightsTools.usageSyncs.paginationUnit'),
					initialLimit: USAGE_SYNCS_PAGE_SIZE,
				}}
				emptyStateConfig={{
					heading: t('insightsTools.usageSyncs.pageHeading'),
					description: t('insightsTools.usageSyncs.emptyDescription'),
				}}
			/>
		</Page>
	);
};

export default UsageSyncs;
