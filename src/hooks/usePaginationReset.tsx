import { useEffect, useRef } from 'react';
import { TypedBackendFilter } from '@/types/formatters/QueryBuilder';
import { TypedBackendSort } from '@/types/formatters/QueryBuilder';

/**
 * Custom hook to reset pagination only when filters or sorts actually change
 * Uses refs to track previous values and avoids expensive stringify operations
 *
 * @param reset - Function to reset pagination to page 1
 * @param filters - Current sanitized filters
 * @param sorts - Current sanitized sorts
 */
export const usePaginationReset = (
	reset: () => void,
	filters: TypedBackendFilter[],
	sorts: TypedBackendSort[],
	additionalQueryKey?: string,
) => {
	const prevFiltersRef = useRef<string | null>(null);
	const prevSortsRef = useRef<string | null>(null);
	const prevAdditionalQueryKeyRef = useRef<string | null>(null);
	const isInitialMount = useRef(true);

	useEffect(() => {
		const currentFiltersKey = JSON.stringify(filters);
		const currentSortsKey = JSON.stringify(sorts);
		const currentAdditionalQueryKey = additionalQueryKey ?? '';

		// Skip on initial mount - don't reset pagination when component first loads
		if (isInitialMount.current) {
			isInitialMount.current = false;
			prevFiltersRef.current = currentFiltersKey;
			prevSortsRef.current = currentSortsKey;
			prevAdditionalQueryKeyRef.current = currentAdditionalQueryKey;
			return;
		}

		const filtersChanged = prevFiltersRef.current !== currentFiltersKey;
		const sortsChanged = prevSortsRef.current !== currentSortsKey;
		const additionalQueryChanged = prevAdditionalQueryKeyRef.current !== currentAdditionalQueryKey;

		if (filtersChanged || sortsChanged || additionalQueryChanged) {
			reset();
			prevFiltersRef.current = currentFiltersKey;
			prevSortsRef.current = currentSortsKey;
			prevAdditionalQueryKeyRef.current = currentAdditionalQueryKey;
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [filters, sorts, additionalQueryKey]); // Dependencies are arrays, but we compare by value
};
