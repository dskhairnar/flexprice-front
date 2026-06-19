import { useSearchParams } from 'react-router';
import { useEffect, useCallback } from 'react';

interface UsePaginationProps {
	initialLimit?: number;
	prefix?: PAGINATION_PREFIX | string;
	/** Used when the page query param is absent (e.g. restored from session). */
	initialPage?: number;
}

export enum PAGINATION_PREFIX {
	WALLET_TRANSACTIONS = 'wallet_transactions',
	PLAN_CHARGES = 'plan_charges',
	COST_SHEET_CHARGES = 'cost_sheet_charges',
	GROUP_CHARGES = 'group_charges',
	SETTINGS_MEMBERS = 'settings_members',
	CUSTOMER_SUBSCRIPTIONS = 'customer_subscriptions',
	SUBSCRIPTION_LINE_ITEMS = 'subscription_line_items',
	TASK_RUNS = 'task_runs',
	FETCH_CUSTOMERS = 'fetchCustomers',
}

const usePagination = ({ initialLimit = 10, prefix, initialPage }: UsePaginationProps = {}) => {
	const [searchParams, setSearchParams] = useSearchParams();

	// Determine the query parameter key based on prefix
	const pageKey = prefix ? `${prefix}_page` : 'page';
	const pageParam = searchParams.get(pageKey);
	const page = pageParam ? Number(pageParam) : (initialPage ?? 1);

	const reset = useCallback(() => {
		setSearchParams((prev) => {
			const next = new URLSearchParams(prev);
			next.set(pageKey, '1');
			return next;
		});
	}, [setSearchParams, pageKey]);

	const setPage = useCallback(
		(newPage: number) => {
			setSearchParams((prev) => {
				const next = new URLSearchParams(prev);
				next.set(pageKey, String(newPage));
				return next;
			});
		},
		[setSearchParams, pageKey],
	);

	// Ensure `page` is set in the query parameters
	useEffect(() => {
		if (searchParams.get(pageKey)) return;
		setSearchParams(
			(prev) => {
				const next = new URLSearchParams(prev);
				next.set(pageKey, String(initialPage ?? 1));
				return next;
			},
			{ replace: true },
		);
	}, [searchParams, setSearchParams, pageKey, initialPage]);

	const limit = initialLimit;
	const offset = limit > 0 ? Math.max((page - 1) * limit, 0) : 0;

	// Expose current page, limit, offset, and a setter for page
	return {
		limit,
		offset,
		page,
		setPage,
		reset,
	};
};

export default usePagination;
