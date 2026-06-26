import { useParams, useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useRef, useEffect, useCallback } from 'react';
import { GroupApi } from '@/api/GroupApi';
import FeatureApi from '@/api/FeatureApi';
import { PriceApi } from '@/api/PriceApi';
import { Card, CardHeader, Loader, NoDataCard, ShortPagination } from '@/components/atoms';
import { FlexpriceTable, ColumnData, QueryBuilder } from '@/components/molecules';
import { ChargeValueCell } from '@/components/molecules';
import { Price, PRICE_STATUS, PRICE_TYPE, PRICE_ENTITY_TYPE } from '@/models';
import { PriceUnit } from '@/models/PriceUnit';
import Feature, { FEATURE_TYPE } from '@/models/Feature';
import { GROUP_ENTITY_TYPE } from '@/models/Group';
import { formatBillingPeriodForDisplay, formatInvoiceCadence, getPriceTypeLabel } from '@/utils/common/helper_functions';
import { formatEntityStatus } from '@/utils/common/format_chips';
import { ENTITY_STATUS } from '@/models';
import formatDate from '@/utils/common/format_date';
import { formatDateTimeWithSecondsAndTimezone } from '@/utils/common/format_date';
import { RouteNames } from '@/core/routes/Routes';
import { useNavigate } from 'react-router';
import RedirectCell from '@/components/molecules/Table/RedirectCell';
import { getFeatureIcon } from '@/components/atoms/SelectFeature/SelectFeature';
import { toSentenceCase } from '@/utils/common/helper_functions';
import { Chip, Tooltip } from '@/components/atoms';
import {
	FilterField,
	FilterFieldType,
	FilterOperator,
	DataType,
	SortDirection,
	DEFAULT_OPERATORS_PER_DATA_TYPE,
	SortOption,
	FilterCondition,
} from '@/types/common/QueryBuilder';
import useFilterSorting from '@/hooks/useFilterSorting';
import usePagination, { PAGINATION_PREFIX } from '@/hooks/usePagination';
import { sanitizeFilterConditions, sanitizeSortConditions } from '@/types/formatters/QueryBuilder';
import { useTranslation } from 'react-i18next';

const GROUP_CHARGES_PAGE_SIZE = 10;

// ----- Price helpers (mirror PlanPriceTable) -----
const getPriceStatus = (price: Price): PRICE_STATUS => {
	const now = new Date();
	if (price.start_date?.trim()) {
		const startDate = new Date(price.start_date);
		if (!isNaN(startDate.getTime()) && startDate > now) return PRICE_STATUS.UPCOMING;
	}
	if (price.end_date?.trim()) {
		const endDate = new Date(price.end_date);
		if (!isNaN(endDate.getTime()) && endDate < now) return PRICE_STATUS.INACTIVE;
	}
	return PRICE_STATUS.ACTIVE;
};

const getStatusChipVariant = (status: PRICE_STATUS): 'info' | 'default' | 'success' => {
	switch (status) {
		case PRICE_STATUS.UPCOMING:
			return 'info';
		case PRICE_STATUS.INACTIVE:
			return 'default';
		default:
			return 'success';
	}
};

const CHARGE_FILTER_FIELD = {
	DISPLAY_NAME: 'display_name',
	AMOUNT: 'amount',
	CHARGE_TYPE: 'type',
	STATUS: 'status',
} as const;

const initialFeatureFilters: FilterCondition[] = [
	{ field: 'name', operator: FilterOperator.CONTAINS, valueString: '', dataType: DataType.STRING, id: 'group-feat-name' },
	{
		field: 'status',
		operator: FilterOperator.IN,
		valueArray: [ENTITY_STATUS.PUBLISHED],
		dataType: DataType.ARRAY,
		id: 'group-feat-status',
	},
];

const GroupOverviewTab = () => {
	const { id: groupId } = useParams();
	const [searchParams] = useSearchParams();
	const { t } = useTranslation(['catalog', 'common']);

	const featureSortOptions: SortOption[] = useMemo(
		() => [
			{ field: 'name', label: t('catalog:features.listPage.sortLabels.name'), direction: SortDirection.ASC },
			{ field: 'created_at', label: t('catalog:features.listPage.sortLabels.createdAt'), direction: SortDirection.DESC },
			{ field: 'updated_at', label: t('catalog:features.listPage.sortLabels.updatedAt'), direction: SortDirection.DESC },
		],
		[t],
	);

	const featureFilterOptions: FilterField[] = useMemo(
		() => [
			{
				field: 'name',
				label: t('catalog:features.listPage.filterLabels.name'),
				fieldType: FilterFieldType.INPUT,
				operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
				dataType: DataType.STRING,
			},
			{
				field: 'created_at',
				label: t('catalog:features.listPage.filterLabels.createdAt'),
				fieldType: FilterFieldType.DATEPICKER,
				operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.DATE],
				dataType: DataType.DATE,
			},
			{
				field: 'status',
				label: t('catalog:features.listPage.filterLabels.status'),
				fieldType: FilterFieldType.MULTI_SELECT,
				operators: [FilterOperator.IN, FilterOperator.NOT_IN],
				dataType: DataType.ARRAY,
				options: [
					{ value: ENTITY_STATUS.PUBLISHED, label: t('catalog:features.listPage.filterStatus.active') },
					{ value: ENTITY_STATUS.ARCHIVED, label: t('catalog:features.listPage.filterStatus.inactive') },
				],
			},
			{
				field: 'type',
				label: t('catalog:features.listPage.filterLabels.type'),
				fieldType: FilterFieldType.MULTI_SELECT,
				operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.ARRAY],
				dataType: DataType.ARRAY,
				options: [
					{ value: FEATURE_TYPE.METERED, label: t('catalog:features.listPage.filterTypes.metered') },
					{ value: FEATURE_TYPE.BOOLEAN, label: t('catalog:features.listPage.filterTypes.boolean') },
					{ value: FEATURE_TYPE.STATIC, label: t('catalog:features.listPage.filterTypes.static') },
				],
			},
		],
		[t],
	);

	const initialFeatureSorts: SortOption[] = useMemo(
		() => [{ field: 'updated_at', label: t('catalog:features.listPage.sortLabels.updatedAt'), direction: SortDirection.DESC }],
		[t],
	);

	const getFeatureTypeChipLabel = useCallback(
		(type: string) => {
			const key = type.toLowerCase();
			if (key === FEATURE_TYPE.STATIC) return t('catalog:features.listPage.typeChips.static');
			if (key === FEATURE_TYPE.METERED) return t('catalog:features.listPage.typeChips.metered');
			if (key === FEATURE_TYPE.BOOLEAN) return t('catalog:features.listPage.typeChips.boolean');
			return t('catalog:features.listPage.typeChips.unknown', { defaultValue: toSentenceCase(type) });
		},
		[t],
	);

	const getFeatureTypeChips = useCallback(
		(type: string, addIcon = false) => {
			const icon = getFeatureIcon(type);
			const label = getFeatureTypeChipLabel(type);
			switch (type.toLocaleLowerCase()) {
				case FEATURE_TYPE.STATIC:
					return <Chip textColor='#4B5563' bgColor='#F3F4F6' icon={addIcon ? icon : null} label={label} className='text-xs' />;
				case FEATURE_TYPE.METERED:
					return <Chip textColor='#1E40AF' bgColor='#DBEAFE' icon={addIcon ? icon : null} label={label} className='text-xs' />;
				case FEATURE_TYPE.BOOLEAN:
					return <Chip textColor='#166534' bgColor='#DCFCE7' icon={addIcon ? icon : null} label={label} className='text-xs' />;
				default:
					return <Chip textColor='#6B7280' bgColor='#F9FAFB' icon={addIcon ? icon : null} label={label} className='text-xs' />;
			}
		},
		[getFeatureTypeChipLabel],
	);

	const formatPriceDateTooltip = useCallback(
		(price: Price & { start_date?: string; end_date?: string }): React.ReactNode => {
			const items: React.ReactNode[] = [];
			if (price.start_date?.trim()) {
				try {
					const d = new Date(price.start_date);
					if (!isNaN(d.getTime()))
						items.push(
							<div key='start' className='flex items-center gap-2'>
								<span className='text-xs font-medium text-gray-500'>{t('common:labels.start')}</span>
								<span className='text-sm font-medium'>{formatDateTimeWithSecondsAndTimezone(d)}</span>
							</div>,
						);
				} catch {
					/* ignore */
				}
			}
			if (price.end_date?.trim()) {
				try {
					const d = new Date(price.end_date);
					if (!isNaN(d.getTime()))
						items.push(
							<div key='end' className='flex items-center gap-2'>
								<span className='text-xs font-medium text-gray-500'>{t('common:labels.end')}</span>
								<span className='text-sm font-medium'>{formatDateTimeWithSecondsAndTimezone(d)}</span>
							</div>,
						);
				} catch {
					/* ignore */
				}
			}
			return items.length ? (
				<div className='flex flex-col gap-2'>{items}</div>
			) : (
				<span className='text-sm'>{t('common:labels.noDateInformation')}</span>
			);
		},
		[t],
	);

	const { data: group, isLoading } = useQuery({
		queryKey: ['fetchGroupDetails', groupId],
		queryFn: () => GroupApi.getGroupById(groupId!),
		enabled: !!groupId,
	});

	const entityTypeFromUrl = searchParams.get('entity_type')?.toLowerCase() || null;
	const effectiveEntityType = (
		entityTypeFromUrl === GROUP_ENTITY_TYPE.PRICE || entityTypeFromUrl === GROUP_ENTITY_TYPE.FEATURE
			? entityTypeFromUrl
			: group?.entity_type === GROUP_ENTITY_TYPE.PRICE || group?.entity_type === GROUP_ENTITY_TYPE.FEATURE
				? group.entity_type
				: null
	) as 'price' | 'feature' | null;

	// Prices for this group (when entity_type is price): backend search with filter/sort/pagination
	const priceIds = useMemo(
		() => (effectiveEntityType === 'price' && group?.entity_ids?.length ? group.entity_ids : []),
		[effectiveEntityType, group?.entity_ids],
	);

	// Features in this group (when entity_type is feature): filter/sort state
	const {
		filters: featureFilters,
		setFilters: setFeatureFilters,
		sorts: featureSorts,
		setSorts: setFeatureSorts,
	} = useFilterSorting({
		initialFilters: initialFeatureFilters,
		initialSorts: initialFeatureSorts,
		debounceTime: 500,
	});

	const groupFilterForFeatures = useMemo(
		() =>
			groupId
				? [{ field: 'group_id', operator: FilterOperator.IN as const, data_type: DataType.ARRAY as const, value: { array: [groupId] } }]
				: [],
		[groupId],
	);

	const mergedFeatureFilters = useMemo(
		() => [...groupFilterForFeatures, ...sanitizeFilterConditions(featureFilters)],
		[groupFilterForFeatures, featureFilters],
	);

	const { data: featuresResponse, isLoading: isLoadingFeatures } = useQuery({
		queryKey: ['fetchGroupFeatures', groupId, mergedFeatureFilters, featureSorts],
		queryFn: () =>
			FeatureApi.getFeaturesByFilter({
				filters: mergedFeatureFilters,
				sort: sanitizeSortConditions(featureSorts),
				limit: 500,
				offset: 0,
			}),
		enabled: effectiveEntityType === 'feature' && !!groupId,
	});

	// Price table filter/sort (client-side, dynamic from form state)
	const chargeFilterOptions: FilterField[] = useMemo(
		() => [
			{
				field: CHARGE_FILTER_FIELD.DISPLAY_NAME,
				label: 'Display name',
				fieldType: FilterFieldType.INPUT,
				operators: [FilterOperator.EQUAL, FilterOperator.CONTAINS],
				dataType: DataType.STRING,
			},
			{
				field: CHARGE_FILTER_FIELD.AMOUNT,
				label: 'Amount',
				fieldType: FilterFieldType.INPUT,
				operators: [FilterOperator.EQUAL, FilterOperator.GREATER_THAN, FilterOperator.LESS_THAN],
				dataType: DataType.NUMBER,
			},
			{
				field: CHARGE_FILTER_FIELD.CHARGE_TYPE,
				label: 'Charge type',
				fieldType: FilterFieldType.MULTI_SELECT,
				operators: [FilterOperator.IN, FilterOperator.NOT_IN],
				dataType: DataType.ARRAY,
				options: [
					{ value: PRICE_TYPE.FIXED, label: 'Fixed charge' },
					{ value: PRICE_TYPE.USAGE, label: 'Usage Based' },
				],
			},
			{
				field: CHARGE_FILTER_FIELD.STATUS,
				label: 'Status',
				fieldType: FilterFieldType.MULTI_SELECT,
				operators: [FilterOperator.IN, FilterOperator.NOT_IN],
				dataType: DataType.ARRAY,
				options: [
					{ value: PRICE_STATUS.ACTIVE, label: 'Active' },
					{ value: PRICE_STATUS.UPCOMING, label: 'Upcoming' },
					{ value: PRICE_STATUS.INACTIVE, label: 'Inactive' },
				],
			},
		],
		[],
	);
	const initialFilters = useMemo(
		() => [
			{
				id: 'group-display_name',
				field: CHARGE_FILTER_FIELD.DISPLAY_NAME,
				operator: FilterOperator.CONTAINS,
				valueString: '',
				dataType: DataType.STRING,
			},
			{ id: 'group-amount', field: CHARGE_FILTER_FIELD.AMOUNT, operator: FilterOperator.EQUAL, valueString: '', dataType: DataType.NUMBER },
			{
				id: 'group-charge_type',
				field: CHARGE_FILTER_FIELD.CHARGE_TYPE,
				operator: FilterOperator.IN,
				valueArray: [],
				dataType: DataType.ARRAY,
			},
			{ id: 'group-status', field: CHARGE_FILTER_FIELD.STATUS, operator: FilterOperator.IN, valueArray: [], dataType: DataType.ARRAY },
		],
		[],
	);
	const chargeSortOptions: SortOption[] = useMemo(
		() => [
			{ field: CHARGE_FILTER_FIELD.DISPLAY_NAME, label: 'Display name', direction: SortDirection.ASC },
			{ field: CHARGE_FILTER_FIELD.AMOUNT, label: 'Amount', direction: SortDirection.ASC },
			{
				field: 'billing_period',
				label: t('catalog:plans.organisms.planPriceTable.queryBuilder.billingPeriod'),
				direction: SortDirection.ASC,
			},
		],
		[t],
	);
	const initialSorts = useMemo(() => [{ field: CHARGE_FILTER_FIELD.AMOUNT, label: 'Amount', direction: SortDirection.ASC }], []);
	const { filters, setFilters, sorts, setSorts } = useFilterSorting({
		initialFilters,
		initialSorts,
		debounceTime: 300,
	});

	const {
		page,
		limit,
		offset,
		reset: resetPage,
	} = usePagination({
		initialLimit: GROUP_CHARGES_PAGE_SIZE,
		prefix: PAGINATION_PREFIX.GROUP_CHARGES,
	});

	const searchFilters = useMemo(() => sanitizeFilterConditions(filters), [filters]);
	const searchSorts = useMemo(() => sanitizeSortConditions(sorts), [sorts]);
	const searchFiltersSignature = useMemo(() => JSON.stringify(searchFilters), [searchFilters]);

	// Group scope: pass group_id eq groupId as a filter instead of entity_ids/entity_type
	const mergedFilters = useMemo(
		() =>
			groupId
				? [
						{ field: 'group_id', operator: FilterOperator.EQUAL, data_type: DataType.STRING as const, value: { string: groupId } },
						...searchFilters,
					]
				: searchFilters,
		[groupId, searchFilters],
	);

	const { data: searchData, isLoading: isLoadingPrices } = useQuery({
		queryKey: ['groupChargesSearch', groupId, mergedFilters, searchSorts, page, limit],
		queryFn: () =>
			PriceApi.searchPrices({
				filters: mergedFilters,
				sorts: searchSorts.length > 0 ? searchSorts : undefined,
				allow_expired_prices: true,
				limit,
				offset,
			}),
		enabled: effectiveEntityType === 'price' && !!groupId && priceIds.length > 0,
	});

	const resetPageRef = useRef(resetPage);
	resetPageRef.current = resetPage;
	useEffect(() => {
		resetPageRef.current();
	}, [searchFiltersSignature]);

	// Use API response directly (minimal computation, same pattern as Features.tsx / QueryableDataArea)
	const tableItems = searchData?.items ?? [];
	const totalFromSearch = searchData?.pagination?.total ?? 0;
	const totalItems = totalFromSearch || Math.max(offset + tableItems.length, limit * page);

	const getPriceRedirectUrl = (price: Price): string | null => {
		if (!price.entity_id?.trim()) return null;
		if (price.entity_type === PRICE_ENTITY_TYPE.PLAN) return `${RouteNames.plan}/${price.entity_id}`;
		if (price.entity_type === PRICE_ENTITY_TYPE.ADDON) return `${RouteNames.addonDetails}/${price.entity_id}`;
		return null;
	};

	const chargeColumns: ColumnData<Price>[] = useMemo(
		() => [
			{
				title: t('catalog:shared.chargeColumns.displayName'),
				render: (row) => {
					const url = getPriceRedirectUrl(row);
					const label = row.display_name ?? t('common:labels.na');
					return url ? <RedirectCell redirectUrl={url}>{label}</RedirectCell> : <span>{label}</span>;
				},
			},
			{ title: t('catalog:shared.chargeColumns.chargeType'), render: (row) => <span>{getPriceTypeLabel(row.type, t)}</span> },
			{
				title: t('catalog:shared.chargeColumns.billingTiming'),
				render: (row) => <span>{formatInvoiceCadence(row.invoice_cadence as string, t)}</span>,
			},
			{
				title: t('catalog:shared.chargeColumns.billingPeriod'),
				render: (row) => <span>{formatBillingPeriodForDisplay(row.billing_period as string, t)}</span>,
			},
			{
				title: t('catalog:shared.chargeColumns.status'),
				render: (row) => {
					const status = getPriceStatus(row);
					const variant = getStatusChipVariant(status);
					const label = status.charAt(0).toUpperCase() + status.slice(1);
					const tooltipContent = formatPriceDateTooltip(row);
					return (
						<Tooltip
							content={tooltipContent}
							delayDuration={0}
							sideOffset={5}
							className='bg-white border border-gray-200 shadow-lg text-sm text-gray-900 px-4 py-3 rounded-[6px] max-w-[320px]'>
							<span>
								<Chip label={label} variant={variant} />
							</span>
						</Tooltip>
					);
				},
			},
			{
				title: t('catalog:shared.chargeColumns.value'),
				render: (row) => <ChargeValueCell data={row as Price & { pricing_unit?: PriceUnit }} />,
			},
		],
		[formatPriceDateTooltip, t],
	);

	const features = featuresResponse?.items ?? [];
	const navigate = useNavigate();
	const featureColumns: ColumnData<Feature>[] = useMemo(
		() => [
			{
				title: t('catalog:shared.entitlementColumns.featureName'),
				render: (row) =>
					row?.id ? (
						<RedirectCell redirectUrl={`${RouteNames.featureDetails}/${row.id}`}>{row.name ?? t('common:labels.na')}</RedirectCell>
					) : (
						<span>{row?.name ?? t('common:labels.na')}</span>
					),
			},
			{ title: t('catalog:shared.entitlementColumns.type'), render: (row) => getFeatureTypeChips(row?.type ?? '', true) },
			{
				title: t('catalog:shared.chargeColumns.status'),
				render: (row) => (
					<Chip
						variant={row?.status === ENTITY_STATUS.PUBLISHED ? 'success' : 'default'}
						label={formatEntityStatus(row?.status ?? '', t)}
					/>
				),
			},
			{ title: t('catalog:shared.chargeColumns.updatedAt'), render: (row) => formatDate(row?.updated_at) },
		],
		[t, getFeatureTypeChips],
	);

	if (isLoading) {
		return <Loader />;
	}

	if (!group) {
		return (
			<div className='flex items-center justify-center h-64'>
				<p className='text-muted-foreground'>{t('catalog:groups.profile.notFound')}</p>
			</div>
		);
	}

	// No entity type resolved: prompt to use query param or show empty state
	if (!effectiveEntityType) {
		return (
			<div className='space-y-6'>
				<p className='text-muted-foreground text-sm'>
					{t('catalog:groups.overview.urlHintAdd')}{' '}
					<code className='rounded bg-muted px-1'>{t('catalog:groups.overview.urlQueryPrice')}</code>{' '}
					{t('catalog:groups.overview.urlHintOr')}{' '}
					<code className='rounded bg-muted px-1'>{t('catalog:groups.overview.urlQueryFeature')}</code>{' '}
					{t('catalog:groups.overview.urlHintSuffix')}
				</p>
			</div>
		);
	}

	// Price view
	if (effectiveEntityType === 'price') {
		if (!priceIds.length) {
			return (
				<div className='space-y-6'>
					<NoDataCard title={t('catalog:addons.details.charges')} subtitle={t('catalog:groups.overview.noPrices')} />
				</div>
			);
		}
		return (
			<div className='space-y-6'>
				<Card variant='notched'>
					<CardHeader title={t('catalog:addons.details.charges')} />
					<div className='pb-3'>
						<QueryBuilder
							filterOptions={chargeFilterOptions}
							filters={filters}
							onFilterChange={setFilters}
							sortOptions={chargeSortOptions}
							selectedSorts={sorts}
							onSortChange={setSorts}
							debounceTime={300}
						/>
					</div>
					{isLoadingPrices ? (
						<div className='flex justify-center py-12'>
							<Loader />
						</div>
					) : (
						<>
							<FlexpriceTable showEmptyRow columns={chargeColumns} data={tableItems} />
							{priceIds.length > 0 && (totalItems > 0 || page > 1) && (
								<ShortPagination unit='Charges' totalItems={totalItems} pageSize={limit} prefix={PAGINATION_PREFIX.GROUP_CHARGES} />
							)}
						</>
					)}
				</Card>
			</div>
		);
	}

	// Feature view
	return (
		<div className='space-y-6'>
			<Card variant='notched'>
				<CardHeader title={t('common:features.title')} />
				<div className='pb-3'>
					<QueryBuilder
						filterOptions={featureFilterOptions}
						filters={featureFilters}
						onFilterChange={setFeatureFilters}
						sortOptions={featureSortOptions}
						selectedSorts={featureSorts}
						onSortChange={setFeatureSorts}
						debounceTime={500}
					/>
				</div>
				{isLoadingFeatures ? (
					<div className='flex justify-center py-12'>
						<Loader />
					</div>
				) : (
					<FlexpriceTable
						columns={featureColumns}
						data={features}
						onRowClick={(row) => row?.id && navigate(`${RouteNames.featureDetails}/${row.id}`)}
						showEmptyRow
					/>
				)}
			</Card>
		</div>
	);
};

export default GroupOverviewTab;
