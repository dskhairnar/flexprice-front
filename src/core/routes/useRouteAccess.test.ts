import { describe, it, expect } from 'vitest';
import { requirePermission, isRouteAccessHandle } from './useRouteAccess';

describe('requirePermission', () => {
	it('returns a handle carrying the entity and action verbatim', () => {
		expect(requirePermission('plan', 'read')).toEqual({ entity: 'plan', action: 'read' });
		expect(requirePermission('invoice', 'write')).toEqual({ entity: 'invoice', action: 'write' });
	});
});

describe('isRouteAccessHandle', () => {
	it('accepts a handle produced by requirePermission', () => {
		expect(isRouteAccessHandle(requirePermission('plan', 'read'))).toBe(true);
	});

	it('rejects undefined, the react-router default for routes with no handle', () => {
		expect(isRouteAccessHandle(undefined)).toBe(false);
	});

	it('rejects null and non-object handles', () => {
		expect(isRouteAccessHandle(null)).toBe(false);
		expect(isRouteAccessHandle('plan')).toBe(false);
		expect(isRouteAccessHandle(42)).toBe(false);
	});

	it('rejects an object missing entity or action', () => {
		expect(isRouteAccessHandle({ entity: 'plan' })).toBe(false);
		expect(isRouteAccessHandle({ action: 'read' })).toBe(false);
		expect(isRouteAccessHandle({})).toBe(false);
	});
});
