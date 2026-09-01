import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import TabRenderer from './TabRenderer';
import type { TabConfig } from '@/types/dto/PortalConfig';
import type { DashboardAnalyticsRequest } from '@/types';

// Stub the lazy-loaded container to observe exactly what `usageData` it receives, without pulling
// in react-query/API mocking for a component this test isn't about.
vi.mock('@/usage/containers/UsageQuotaContainer', () => ({
	default: ({ usageData }: { usageData?: unknown[] }) => (
		<div data-testid='usage-quota-container' data-usage-data-defined={String(usageData !== undefined)} />
	),
}));

const TAB: TabConfig = { id: '1', type: 'current_usage', enabled: true, order: 0 };
const ANALYTICS_PARAMS: DashboardAnalyticsRequest = {};

describe('TabRenderer', () => {
	// Regression: TabRenderer used to default `usageData` to `[]`, which UsageQuotaContainer reads
	// as "already pre-fetched, don't run the fallback query" (`enabled: usageData === undefined`).
	// A parent that never pre-fetches usage data left the current-usage tab permanently empty.
	it('forwards usageData as undefined (not []) when the caller omits it, so the fallback query stays enabled', async () => {
		render(<TabRenderer tab={TAB} analyticsParams={ANALYTICS_PARAMS} />);
		const el = await screen.findByTestId('usage-quota-container');
		expect(el).toHaveAttribute('data-usage-data-defined', 'false');
	});

	it('still forwards an explicitly pre-fetched usageData array through unchanged', async () => {
		render(<TabRenderer tab={TAB} usageData={[]} analyticsParams={ANALYTICS_PARAMS} />);
		const el = await screen.findByTestId('usage-quota-container');
		expect(el).toHaveAttribute('data-usage-data-defined', 'true');
	});
});
