import { useQuery } from '@tanstack/react-query';
import { UserApi } from '@/api/UserApi';
import AuthService from '@/core/auth/AuthService';

const useUser = () => {
	const tokenStr = AuthService.getAcessToken();

	const {
		data: user,
		isLoading: loading,
		error,
		refetch,
	} = useQuery({
		queryKey: ['user', tokenStr],
		queryFn: async () => {
			return await UserApi.me();
		},
		enabled: !!tokenStr,
		retry: 4,
		retryDelay: 1000,
		// The app's global query defaults disable every refetch trigger
		// (refetchOnWindowFocus/Mount/Reconnect: false, refetchInterval: false,
		// gcTime: 0) — without an override here, this stays mounted for the whole
		// session (via MainLayout) and, once fetched, never refetches again.
		// `roles` feeds every RBAC permission check, so if an admin changes this
		// user's roles mid-session, they'd otherwise see stale permissions until
		// a full page reload. Poll instead of relying on any global trigger.
		refetchInterval: 60 * 1000,
	});

	return { user, loading, error, refetch };
};

export default useUser;
