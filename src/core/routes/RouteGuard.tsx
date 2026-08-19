import { Outlet, useMatches } from 'react-router';
import { Loader } from '@/components/atoms';
import { useCurrentUserPermissions } from '@/hooks/useCurrentUserPermissions';
import ErrorPage from '@/pages/error/ErrorPage';
import { isRouteAccessHandle } from './useRouteAccess';

/**
 * Sits where `<Outlet />` used to in MainLayout. Reads the deepest matched route's `handle` (set
 * via `requirePermission()` in Routes.tsx) and blocks render with ErrorPage's forbidden variant
 * when the current user lacks that permission. Routes without a `handle` are unrestricted.
 */
const RouteGuard = () => {
	const matches = useMatches();
	const { can, isLoading } = useCurrentUserPermissions();

	const required = [...matches]
		.reverse()
		.map((match) => match.handle)
		.find(isRouteAccessHandle);

	if (!required) return <Outlet />;

	// See useCurrentUserPermissions's `rolesNotYetFetched` — without this, `can()` briefly
	// evaluates against an empty role catalog and this would flash "Access denied" on every load.
	if (isLoading) return <Loader />;

	if (!can(required.entity, required.action)) return <ErrorPage variant='forbidden' />;

	return <Outlet />;
};

export default RouteGuard;
