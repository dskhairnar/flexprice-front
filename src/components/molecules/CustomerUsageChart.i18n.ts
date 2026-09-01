//
// Bundled i18n so CustomerUsageChart renders real English out-of-the-box when reused by exportable
// components (e.g. @flexprice/ui's UsageTrendChart) — WITHOUT overriding a host app that
// has its own i18n. Mirrors `src/pricing/i18n.ts`.
import { createBundledT } from '@/lib/exportable/bundledI18n';

const EN_CUSTOMER_CHARTS = {
	usageNoDataDescription: 'No usage data available',
	usageNoDataBody: 'No data to display',
	resetZoom: 'Reset zoom',
	selectingArea: 'Selecting area...',
	seriesFallback: 'Series {{index}}',
};

export const useCustomerUsageChartT = createBundledT('common', { customerCharts: EN_CUSTOMER_CHARTS }).useBoundT;
