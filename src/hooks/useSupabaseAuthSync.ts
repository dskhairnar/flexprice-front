import { useEffect } from 'react';
import supabase from '@/core/services/supbase/config';
import { queryClient } from '@/core/services/tanstack/ReactQueryProvider';

/**
 * Bridges Supabase's own auth events into TanStack Query.
 *
 * useUser/useRbacRoles gate themselves on AuthService.peekStoredToken(), a synchronous
 * localStorage snapshot — but supabase-js persists a freshly-signed-in session to storage
 * asynchronously (behind an internal lock), so a component that reads the token right after
 * signInWithPassword() resolves and navigate() fires can still see the pre-login (empty)
 * value. Since nothing else prompts a re-render at that point, the 'user'/'rbac-roles'
 * queries stay permanently disabled with a stale key — the roles request never fires, the
 * page renders "Access denied", and only a hard refresh (which reads storage cold, after the
 * session has settled) recovers.
 *
 * Subscribing to onAuthStateChange and invalidating on every event forces a fresh fetch
 * regardless of what the stale cache key was: the actual request still resolves correctly,
 * since axiosClient's interceptor authenticates via the async AuthService.getAcessToken(),
 * which awaits Supabase's own session state rather than racing a raw storage read.
 */
export function useSupabaseAuthSync() {
	useEffect(() => {
		const { data } = supabase.auth.onAuthStateChange(() => {
			queryClient.invalidateQueries({ queryKey: ['user'], exact: false });
			queryClient.invalidateQueries({ queryKey: ['rbac-roles'], exact: false });
		});
		return () => data?.subscription?.unsubscribe();
	}, []);
}

export default useSupabaseAuthSync;
