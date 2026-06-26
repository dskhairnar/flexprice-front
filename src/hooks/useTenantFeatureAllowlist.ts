import { useMemo } from 'react';
import { config } from '@/config/config';
import useUser from '@/hooks/useUser';

export function isTenantFeatureAllowlisted(tenantId: string | undefined | null): boolean {
	if (!tenantId) return false;
	return config.features.tenantFeatureAllowlist.includes(tenantId);
}

/** True when the current tenant is in `VITE_TENANT_FEATURE_ALLOWLIST`. */
export function useTenantFeatureAllowlist(): boolean {
	const { user } = useUser();
	return useMemo(() => isTenantFeatureAllowlisted(user?.tenant?.id), [user?.tenant?.id]);
}
