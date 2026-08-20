import { useQuery } from '@tanstack/react-query';
import RbacApi, { RbacRole } from '@/api/RbacApi';
import AuthService from '@/core/auth/AuthService';

export function useRbacRoles(userType: 'user' | 'service_account', options?: { enabled?: boolean }) {
	// Scoped by the session token, mirroring useUser's ['user', tokenStr] key, so the
	// cache can't outlive a login/logout boundary. peekStoredToken() is a sync read —
	// getAcessToken() is async even for the locally-stored-token path, so it always
	// resolves to a Promise object and both keys would collapse to the same shape.
	const tokenStr = AuthService.peekStoredToken();

	return useQuery<RbacRole[]>({
		queryKey: ['rbac-roles', userType, tokenStr],
		queryFn: () => RbacApi.getAllRoles(userType),
		enabled: options?.enabled ?? true,
		staleTime: 5 * 60 * 1000,
		// See useUser.tsx — the app's global query defaults disable every refetch
		// trigger, so staleTime alone is inert without an active trigger to act on
		// it. Role *definitions* rarely change, so this stays far less aggressive
		// than useUser's poll.
		refetchInterval: 5 * 60 * 1000,
		retry: false,
	});
}
