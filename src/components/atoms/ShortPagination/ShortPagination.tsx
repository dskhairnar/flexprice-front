import usePagination, { PAGINATION_PREFIX } from '@/hooks/usePagination';
import { ShortPaginationControls, type ShortPaginationControlsProps } from './ShortPaginationControls';

export { ShortPaginationControls, type ShortPaginationControlsProps };

interface ShortPaginationProps {
	totalItems: number;
	pageSize?: number;
	showPages?: boolean;
	unit?: string;
	prefix?: PAGINATION_PREFIX | string;
}

const ShortPagination = ({ totalItems, pageSize, unit, showPages = false, prefix }: ShortPaginationProps) => {
	const { page, setPage, limit } = usePagination({
		initialLimit: pageSize,
		prefix,
	});

	const effectivePageSize = pageSize || limit;

	return (
		<ShortPaginationControls
			page={page}
			onPageChange={setPage}
			totalItems={totalItems}
			pageSize={effectivePageSize}
			unit={unit}
			showPages={showPages}
		/>
	);
};

export default ShortPagination;
