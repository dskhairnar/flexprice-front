import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router';
import { CustomerOrgTypeFilterValue } from '@/constants/customerOrgTypeFilter';
import { getOrgTypeParamKey, parsePersistedOrgTypeFilter } from '@/utils/filterPersistence';

/** Persists parent/child org_type selection in the URL (`{key}_org_type`), matching list filter params. */
export function usePersistedOrgTypeFilter(persistenceKey: string) {
	const [searchParams, setSearchParams] = useSearchParams();
	const paramKey = getOrgTypeParamKey(persistenceKey);

	const [orgTypeFilter, setOrgTypeFilterState] = useState<CustomerOrgTypeFilterValue | null>(() => {
		if (typeof window === 'undefined') return null;
		const fromUrl = parsePersistedOrgTypeFilter(new URLSearchParams(window.location.search).get(paramKey));
		if (fromUrl) return fromUrl;
		return parsePersistedOrgTypeFilter(searchParams.get(paramKey));
	});

	const setOrgTypeFilter = useCallback(
		(value: CustomerOrgTypeFilterValue | null) => {
			setOrgTypeFilterState(value);
			setSearchParams(
				(prev) => {
					const next = new URLSearchParams(prev);
					if (value) next.set(paramKey, value);
					else next.delete(paramKey);
					return next;
				},
				{ replace: true },
			);
		},
		[paramKey, setSearchParams],
	);

	return [orgTypeFilter, setOrgTypeFilter] as const;
}
