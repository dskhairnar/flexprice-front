import { Outlet, useMatches } from 'react-router';
import { Loader } from '@/components/atoms';
import { useCurrentUserPermissions } from '@/hooks/useCurrentUserPermissions';
import { ErrorPage } from '@/components/organisms';
import { isRouteAccessHandle } from './useRouteAccess';

/**
 * Sits where `<Outlet />` used to in MainLayout. Reads every matched route's `handle` (set via
 * `requirePermission()` in Routes.tsx) — not just the deepest one — and blocks render with
 * ErrorPage's forbidden variant unless the current user passes ALL of them. A child route is
 * reached through its ancestors; checking only the leaf would let a permission required by a
 * parent route be silently dropped whenever the child itself carries a different (or no) handle.
 * Routes without any handle in the chain are unrestricted.
 */
const RouteGuard = () => {
	const matches = useMatches();
	const { can, isLoading } = useCurrentUserPermissions();

	const required = matches.map((match) => match.handle).filter(isRouteAccessHandle);

	if (required.length === 0) return <Outlet />;

	// See useCurrentUserPermissions's `rolesNotYetFetched` — without this, `can()` briefly
	// evaluates against an empty role catalog and this would flash "Access denied" on every load.
	if (isLoading) return <Loader />;

	if (required.some((handle) => !can(handle.entity, handle.action))) return <ErrorPage variant='forbidden' />;

	return <Outlet />;
};

export default RouteGuard;
