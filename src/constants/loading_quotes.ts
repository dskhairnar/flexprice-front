/** i18n keys under `common:loadingQuotes.*` — resolved in Loader via useTranslation. */
export const LOADING_QUOTE_KEYS = [
	'loadingQuotes.calculatingMetrics',
	'loadingQuotes.analyzingConsumption',
	'loadingQuotes.preparingBillingInsights',
	'loadingQuotes.countingBytes',
	'loadingQuotes.calculatorsDancing',
	'loadingQuotes.pennyFindsHome',
	'loadingQuotes.usageMathDance',
	'loadingQuotes.beautifulCharts',
	'loadingQuotes.hamstersRunning',
	'loadingQuotes.brewingInsights',
	'loadingQuotes.prettyNumbers',
	'loadingQuotes.sprinklingMagic',
	'loadingQuotes.usageStoryLoading',
	'loadingQuotes.paintingWithData',
	'loadingQuotes.billingInsightsSmile',
	'loadingQuotes.measuringAwesomeWork',
	'loadingQuotes.coffeeIntoCalculations',
	'loadingQuotes.countEveryBit',
	'loadingQuotes.greatThingsTakeTime',
	'loadingQuotes.insightsWorthWaiting',
	'loadingQuotes.sundayBest',
	'loadingQuotes.feastOfInsights',
	'loadingQuotes.aiCountFaster',
	'loadingQuotes.synchronizedSwimming',
	'loadingQuotes.quantumComputing',
	'loadingQuotes.pixelsMarch',
	'loadingQuotes.usageStories',
	'loadingQuotes.everyClickCounts',
	'loadingQuotes.complexMath',
] as const;

export type LoadingQuoteKey = (typeof LOADING_QUOTE_KEYS)[number];

/** Resolve a loading quote key via i18n; falls back to the generic loading label if missing. */
export function translateLoadingQuote(t: (key: string) => string, key: LoadingQuoteKey): string {
	const translated = t(`common:${key}`);
	if (!translated || translated === key || translated === `common:${key}`) {
		return t('common:status.loading');
	}
	return translated;
}

export default LOADING_QUOTE_KEYS;
