import { describe, it, expect } from 'vitest';
import { requirePermission, isRouteAccessHandle } from './useRouteAccess';

describe('requirePermission', () => {
	it('returns a handle carrying the entity and action verbatim', () => {
		expect(requirePermission('plan', 'read')).toEqual({ entity: 'plan', action: 'read' });
		expect(requirePermission('invoice', 'write')).toEqual({ entity: 'invoice', action: 'write' });
	});

	it('accepts an action array for routes that are the only navigable path to a write action', () => {
		expect(requirePermission('creditnote', ['read', 'write'])).toEqual({ entity: 'creditnote', action: ['read', 'write'] });
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

	it('accepts a handle produced by requirePermission with an action array', () => {
		expect(isRouteAccessHandle(requirePermission('creditnote', ['read', 'write']))).toBe(true);
	});

	it('rejects an empty action array or one containing an invalid action', () => {
		expect(isRouteAccessHandle({ entity: 'plan', action: [] })).toBe(false);
		expect(isRouteAccessHandle({ entity: 'plan', action: ['read', 'delete'] })).toBe(false);
	});

	it('rejects a handle with a non-string entity or invalid action value', () => {
		expect(isRouteAccessHandle({ entity: null, action: [] })).toBe(false);
		expect(isRouteAccessHandle({ entity: 'plan', action: 'delete' })).toBe(false);
	});
});
