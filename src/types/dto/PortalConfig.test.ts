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

	it('falls back to defaults when the tenant has no sections', () => {
		const merged = deepMergePortalConfig(DEFAULT_PORTAL_CONFIG, {});
		expect(merged.sections).toEqual(DEFAULT_PORTAL_CONFIG.sections);
	});
});
