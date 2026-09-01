import { describe, it, expect } from 'vitest';
import { deepMergePortalConfig, DEFAULT_PORTAL_CONFIG, type PortalConfig } from './PortalConfig';

const tenantConfig: Partial<PortalConfig> = {
	sections: [{ id: 'usage', label: 'Usage', enabled: true, order: 1, tabs: [] }],
};

describe('deepMergePortalConfig', () => {
	// A stored config carries the order values current when it was saved, so a
	// section later promoted in the defaults would otherwise stay where it was.
	it('puts Overview first even when the stored config ordered it last', () => {
		const merged = deepMergePortalConfig(DEFAULT_PORTAL_CONFIG, {
			sections: [
				{ id: 'usage', label: 'Usage', enabled: true, order: 1, tabs: [] },
				{ id: 'invoices', label: 'Invoices', enabled: true, order: 2, tabs: [] },
				{ id: 'credits', label: 'Credits', enabled: true, order: 3, tabs: [] },
				{ id: 'overview', label: 'Overview', enabled: true, order: 4, tabs: [] },
			],
		});
		expect(merged.sections.map((s) => s.id)).toEqual(['overview', 'usage', 'credits', 'invoices', 'payment_methods']);
	});

	it('keeps the tenant label and enabled flag while reordering', () => {
		const merged = deepMergePortalConfig(DEFAULT_PORTAL_CONFIG, {
			sections: [{ id: 'usage', label: 'My Usage', enabled: false, order: 9, tabs: [] }],
		});
		const usage = merged.sections.find((s) => s.id === 'usage');
		expect(usage?.label).toBe('My Usage');
		expect(usage?.enabled).toBe(false);
	});

	// A section only the tenant has must survive, placed after the known ones.
	it('keeps a tenant-only section', () => {
		const merged = deepMergePortalConfig(DEFAULT_PORTAL_CONFIG, {
			sections: [{ id: 'custom', label: 'Custom', enabled: true, order: 1, tabs: [] }],
		});
		expect(merged.sections.map((s) => s.id)).toContain('custom');
	});

	// A stored config used to replace the defaults wholesale, so a tenant who had
	// ever saved one never saw a newly shipped section — the Payments tab was
	// defined but invisible.
	it('appends default sections the tenant has never seen', () => {
		const merged = deepMergePortalConfig(DEFAULT_PORTAL_CONFIG, tenantConfig);
		expect(merged.sections.map((s) => s.id)).toContain('payment_methods');
	});

	it('does not duplicate a section the tenant already has', () => {
		const merged = deepMergePortalConfig(DEFAULT_PORTAL_CONFIG, tenantConfig);
		expect(merged.sections.filter((s) => s.id === 'usage')).toHaveLength(1);
	});

	// Removal is expressed with enabled:false, which must still be respected.
	it('respects a section the tenant disabled rather than re-adding it', () => {
		const merged = deepMergePortalConfig(DEFAULT_PORTAL_CONFIG, {
			sections: [{ id: 'payment_methods', label: 'Payments', enabled: false, order: 1, tabs: [] }],
		});
		expect(merged.sections.find((s) => s.id === 'payment_methods')?.enabled).toBe(false);
	});

	// Cost and Margin are the tenant's cost to serve and their profit on this
	// customer. A portal must opt in deliberately rather than leak them by default.
	it('does not enable cost and margin cards by default', () => {
		const metricTabs = DEFAULT_PORTAL_CONFIG.sections.flatMap((section) => section.tabs).filter((tab) => tab.type === 'metric_cards');

		expect(metricTabs.length).toBeGreaterThan(0);
		for (const tab of metricTabs) {
			expect(tab.metric_cards?.show_cost_metrics).toBe(false);
		}
	});

	it('falls back to defaults when the tenant has no sections', () => {
		const merged = deepMergePortalConfig(DEFAULT_PORTAL_CONFIG, {});
		expect(merged.sections).toEqual(DEFAULT_PORTAL_CONFIG.sections);
	});
});

describe('Overview carries no analytics', () => {
	const overviewTabs = (config: PortalConfig) => config.sections.find((section) => section.id === 'overview')?.tabs ?? [];

	// Overview summarises account state; Usage is the analytics page. Any analytics
	// tab in Overview also renders the section's date filter, so a stored config
	// from before that split opened the summary on a chart and a timeline picker
	// duplicating the Usage tab.
	it('drops a usage trend a stored config left in Overview', () => {
		const merged = deepMergePortalConfig(DEFAULT_PORTAL_CONFIG, {
			sections: [
				{
					id: 'overview',
					label: 'Overview',
					enabled: true,
					order: 1,
					tabs: [
						{ id: '14', type: 'account_summary', enabled: true, order: 1 },
						{ id: '20', type: 'usage_graph', enabled: true, order: 2 },
						{ id: '21', type: 'metric_cards', enabled: true, order: 3 },
						{ id: '22', type: 'usage_breakdown', enabled: true, order: 4 },
						{ id: '9', type: 'subscriptions', enabled: true, order: 5 },
					],
				},
			],
		});

		expect(overviewTabs(merged).map((tab) => tab.type)).toEqual(['account_summary', 'subscriptions']);
	});

	// The rule is about Overview only — Usage is where analytics belong.
	it('leaves the Usage section untouched', () => {
		const merged = deepMergePortalConfig(DEFAULT_PORTAL_CONFIG, {});
		const usage = merged.sections.find((section) => section.id === 'usage');
		expect(usage?.tabs.map((tab) => tab.type)).toContain('usage_graph');
	});

	// Stripping every tab would leave the customer clicking Overview and landing on
	// an empty page, so such a config falls back to the default summary.
	it('falls back to the default tabs when Overview held nothing else', () => {
		const merged = deepMergePortalConfig(DEFAULT_PORTAL_CONFIG, {
			sections: [
				{ id: 'overview', label: 'Overview', enabled: true, order: 1, tabs: [{ id: '20', type: 'usage_graph', enabled: true, order: 1 }] },
			],
		});

		expect(overviewTabs(merged).map((tab) => tab.type)).toEqual(['account_summary', 'subscriptions', 'current_usage']);
	});

	it('has no analytics in the shipped defaults either', () => {
		const types = DEFAULT_PORTAL_CONFIG.sections.find((section) => section.id === 'overview')!.tabs.map((tab) => tab.type);
		expect(types).not.toContain('usage_graph');
		expect(types).not.toContain('metric_cards');
		expect(types).not.toContain('usage_breakdown');
	});
});
