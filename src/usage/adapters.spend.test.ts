import { describe, it, expect } from 'vitest';
import { adaptMetricCards } from './adapters';

const costData = {
	currency: 'USD',
	total_revenue: '12.34',
	total_cost: '5.00',
	margin: '7.34',
	margin_percent: '59.5',
} as never;

describe('adaptMetricCards visibility', () => {
	// The customer sees what they spent; the tenant's margin on them is not theirs.
	it('omits cost and margin when cost metrics are off', () => {
		const items = adaptMetricCards(costData, [], {
			show_custom_metrics: false,
			show_revenue_metric: true,
			show_cost_metrics: false,
		});
		const ids = items.map((item) => item.id);
		expect(ids).toContain('revenue');
		expect(ids).not.toContain('cost');
		expect(ids).not.toContain('margin');
		expect(ids).not.toContain('margin-percent');
	});

	it('still exposes them when a tenant deliberately turns them on', () => {
		const items = adaptMetricCards(costData, [], {
			show_custom_metrics: false,
			show_revenue_metric: true,
			show_cost_metrics: true,
		});
		expect(items.map((item) => item.id)).toEqual(expect.arrayContaining(['cost', 'margin', 'margin-percent']));
	});
});
