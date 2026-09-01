import { describe, it, expect } from 'vitest';
import { deepMergePortalConfig, DEFAULT_PORTAL_CONFIG, type PortalConfig } from './PortalConfig';

const tenantConfig: Partial<PortalConfig> = {
	sections: [{ id: 'usage', label: 'Usage', enabled: true, order: 1, tabs: [] }],
};

describe('deepMergePortalConfig', () => {
	it('keeps tenant sections and their ordering', () => {
		const merged = deepMergePortalConfig(DEFAULT_PORTAL_CONFIG, tenantConfig);
		expect(merged.sections[0].id).toBe('usage');
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
