import type { RbacAction, RbacEntity } from '@/hooks/useCurrentUserPermissions';

/**
 * Attached to a route's `handle` to declare the permission required to view it. Read by
 * RouteGuard via useMatches(). `action` accepts more than one action for routes that are the
 * only navigable path to a write action (e.g. a list page gating its own "create" flow) — a
 * write-only role still needs to reach the list to use the write permission it actually has,
 * so those routes pass ANY of the given actions rather than requiring all of them.
 */
export interface RouteAccessHandle {
	entity: RbacEntity;
	action: RbacAction | RbacAction[];
}

/** Route-config helper: `handle: requirePermission('plan', 'read')`, or `requirePermission('creditnote', ['read', 'write'])`. */
export function requirePermission(entity: RbacEntity, action: RbacAction | RbacAction[]): RouteAccessHandle {
	return { entity, action };
}

function isRbacAction(value: unknown): value is RbacAction {
	return value === 'read' || value === 'write';
}

/** `useMatches()` types `handle` as `unknown` — narrow before reading `entity`/`action`. */
export function isRouteAccessHandle(handle: unknown): handle is RouteAccessHandle {
	if (typeof handle !== 'object' || handle === null) return false;
	const { entity, action } = handle as Record<string, unknown>;
	if (typeof entity !== 'string') return false;
	return Array.isArray(action) ? action.length > 0 && action.every(isRbacAction) : isRbacAction(action);
}
