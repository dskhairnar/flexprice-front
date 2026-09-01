import type { TFunction } from 'i18next';
import {
	FilterField,
	FilterFieldType,
	DEFAULT_OPERATORS_PER_DATA_TYPE,
	DataType,
	SortOption,
	SortDirection,
	FilterCondition,
} from '@/types/common/QueryBuilder';

export const usageSyncsInitialFilters: FilterCondition[] = [];

export function getUsageSyncsFilterOptions(t: TFunction<'settings'>): FilterField[] {
	return [
		{
			field: 'customer_id',
			label: t('insightsTools.usageSyncs.filterLabels.customerId'),
			fieldType: FilterFieldType.INPUT,
			operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
			dataType: DataType.STRING,
		},
		{
			field: 'subscription_id',
			label: t('insightsTools.usageSyncs.filterLabels.subscriptionId'),
			fieldType: FilterFieldType.INPUT,
			operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
			dataType: DataType.STRING,
		},
		{
			field: 'period_start',
			label: t('insightsTools.usageSyncs.filterLabels.periodStart'),
			fieldType: FilterFieldType.DATEPICKER,
			operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.DATE],
			dataType: DataType.DATE,
		},
		{
			field: 'period_end',
			label: t('insightsTools.usageSyncs.filterLabels.periodEnd'),
			fieldType: FilterFieldType.DATEPICKER,
			operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.DATE],
			dataType: DataType.DATE,
		},
	];
}

export function getUsageSyncsSortOptions(t: TFunction<'settings'>): SortOption[] {
	return [
		{ field: 'created_at', label: t('insightsTools.usageSyncs.sortLabels.createdAt'), direction: SortDirection.DESC },
		{ field: 'period_start', label: t('insightsTools.usageSyncs.sortLabels.periodStart'), direction: SortDirection.DESC },
		{ field: 'period_end', label: t('insightsTools.usageSyncs.sortLabels.periodEnd'), direction: SortDirection.DESC },
	];
}

export function getUsageSyncsInitialSorts(t: TFunction<'settings'>): SortOption[] {
	return [{ field: 'created_at', label: t('insightsTools.usageSyncs.sortLabels.createdAt'), direction: SortDirection.DESC }];
}
