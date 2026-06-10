import type { TFunction } from 'i18next';
import i18n from 'i18next';
import { METER_AGGREGATION_TYPE, METER_USAGE_RESET_PERIOD } from '@/models/Meter';

const AGGREGATION_TYPE_I18N_KEY: Partial<Record<METER_AGGREGATION_TYPE, string>> = {
	[METER_AGGREGATION_TYPE.SUM]: 'sum',
	[METER_AGGREGATION_TYPE.COUNT]: 'count',
	[METER_AGGREGATION_TYPE.COUNT_UNIQUE]: 'countUnique',
	[METER_AGGREGATION_TYPE.LATEST]: 'latest',
	[METER_AGGREGATION_TYPE.SUM_WITH_MULTIPLIER]: 'sumWithMultiplier',
	[METER_AGGREGATION_TYPE.MAX]: 'max',
	[METER_AGGREGATION_TYPE.WEIGHTED_SUM]: 'weightedSum',
	[METER_AGGREGATION_TYPE.AVG]: 'avg',
};

export const formatMeterUsageResetPeriodToDisplay = (usageResetPeriod: string, t?: TFunction<'catalog'>) => {
	const translator = t ?? i18n.getFixedT(i18n.language ?? 'en', 'catalog');
	switch (usageResetPeriod) {
		case METER_USAGE_RESET_PERIOD.BILLING_PERIOD:
			return translator('features.details.usageResetPeriod.periodic');
		case METER_USAGE_RESET_PERIOD.NEVER:
			return translator('features.details.usageResetPeriod.cumulative');
		default:
			return usageResetPeriod;
	}
};

export const formatAggregationTypeToDisplay = (aggregationType: string, t?: TFunction<'catalog'>) => {
	const translator = t ?? i18n.getFixedT(i18n.language ?? 'en', 'catalog');
	const segment = AGGREGATION_TYPE_I18N_KEY[aggregationType as METER_AGGREGATION_TYPE];
	if (segment) return translator(`features.details.aggregationTypes.${segment}`);
	return aggregationType;
};
