import type { RbacAction, RbacEntity } from '@/hooks/useCurrentUserPermissions';

/** Attached to a route's `handle` to declare the permission required to view it. Read by RouteGuard via useMatches(). */
export interface RouteAccessHandle {
	entity: RbacEntity;
	action: RbacAction;
}

/** Route-config helper: `handle: requirePermission('plan', 'read')`. */
export function requirePermission(entity: RbacEntity, action: RbacAction): RouteAccessHandle {
	return { entity, action };
}

/** `useMatches()` types `handle` as `unknown` — narrow before reading `entity`/`action`. */
export function isRouteAccessHandle(handle: unknown): handle is RouteAccessHandle {
	return typeof handle === 'object' && handle !== null && 'entity' in handle && 'action' in handle;
}
