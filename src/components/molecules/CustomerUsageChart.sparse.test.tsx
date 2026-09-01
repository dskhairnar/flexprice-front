import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';

// Recharts' ResponsiveContainer measures its parent, which is 0x0 in jsdom, so nothing
// renders. Give it a fixed size so the chart's own output is observable.
vi.mock('recharts', async () => {
	const actual = await vi.importActual<typeof import('recharts')>('recharts');
	return {
		...actual,
		ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
			<actual.ResponsiveContainer width={800} height={400}>
				{children as never}
			</actual.ResponsiveContainer>
		),
	};
});

const { CustomerUsageChart } = await import('@/components/molecules/CustomerUsageChart');

const series = (n: number) => ({
	total_cost: 0,
	currency: 'USD',
	items: [
		{
			feature_id: 'f1',
			source: 'f1',
			name: 'featN-2',
			total_usage: 0,
			total_cost: 0,
			event_count: 0,
			points: Array.from({ length: n }, (_, i) => ({
				timestamp: `2026-08-${27 + i}T00:00:00Z`,
				usage: 15030 + i,
				cost: 0,
				event_count: 1,
			})),
		},
	],
});

describe('CustomerUsageChart single-point rendering', () => {
	it('renders a visible marker when the series has one point', () => {
		const { container } = render(<CustomerUsageChart data={series(1) as never} title='Usage Trend' />);
		expect(container.querySelectorAll('.recharts-line-dot').length).toBeGreaterThan(0);
	});

	it('draws a line once there are two or more points', () => {
		const { container } = render(<CustomerUsageChart data={series(3) as never} title='Usage Trend' />);
		expect(container.querySelectorAll('.recharts-line-curve').length).toBeGreaterThan(0);
	});

	// chartData zero-fills every series on every row, so a one-point series among
	// dense ones still draws a line and stays visible — which is why the marker
	// check keys off the chart's row count rather than each series'.
	it('renders a sparse series alongside a dense one as a line, not nothing', () => {
		const mixed = {
			total_cost: 0,
			currency: 'USD',
			items: [
				{
					feature_id: 'dense',
					source: 'dense',
					name: 'dense',
					total_usage: 0,
					total_cost: 0,
					event_count: 0,
					points: Array.from({ length: 5 }, (_, i) => ({
						timestamp: `2026-08-2${5 + i}T00:00:00Z`,
						usage: 10 + i,
						cost: 0,
						event_count: 1,
					})),
				},
				{
					feature_id: 'sparse',
					source: 'sparse',
					name: 'sparse',
					total_usage: 0,
					total_cost: 0,
					event_count: 0,
					points: [{ timestamp: '2026-08-27T00:00:00Z', usage: 99, cost: 0, event_count: 1 }],
				},
			],
		};
		const { container } = render(<CustomerUsageChart data={mixed as never} title='Usage Trend' />);
		// Both series draw, so neither is invisible.
		expect(container.querySelectorAll('.recharts-line-curve')).toHaveLength(2);
	});
});
