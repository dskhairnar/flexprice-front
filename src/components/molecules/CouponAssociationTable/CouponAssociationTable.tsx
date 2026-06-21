import { FC, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import CouponApi from '@/api/CouponApi';
import FlexpriceTable, { ColumnData } from '../Table';
import { Chip, Button } from '@/components/atoms';
import { formatDateShort, getCurrencySymbol } from '@/utils/common/helper_functions';
import { RouteNames } from '@/core/routes/Routes';
import { CouponAssociation } from '@/models/CouponAssociation';
import { COUPON_TYPE } from '@/types/common/Coupon';
import { TrashIcon } from 'lucide-react';

interface Props {
	subscriptionId: string;
	onRemove?: (association: CouponAssociation) => void;
}

const formatDiscount = (association: CouponAssociation): string => {
	const c = association.coupon;
	if (!c) return '—';
	if (c.type === COUPON_TYPE.PERCENTAGE) return `${c.percentage_off ?? 0}%`;
	return `${getCurrencySymbol(c.currency)}${c.amount_off ?? '0.00'}`;
};

const CouponAssociationTable: FC<Props> = ({ subscriptionId, onRemove }) => {
	const { t } = useTranslation('common');

	const { data } = useQuery({
		queryKey: ['couponAssociations', subscriptionId],
		queryFn: () => CouponApi.listCouponAssociations({ subscription_ids: [subscriptionId], active_only: true }),
		enabled: !!subscriptionId,
	});

	const rows = useMemo(() => {
		const now = new Date();
		return (data?.items ?? []).filter((a) => !a.end_date || new Date(a.end_date) > now);
	}, [data?.items]);

	const columns: ColumnData<CouponAssociation>[] = [
		{
			title: 'Coupon Name',
			render: (row) =>
				row.coupon ? (
					<Link to={`${RouteNames.coupons}/${row.coupon_id}`} className='text-primary hover:underline'>
						{row.coupon.name}
					</Link>
				) : (
					row.coupon_id
				),
		},
		{
			title: 'Coupon Code',
			render: (row) =>
				row.coupon?.coupon_code ? <code className='font-mono bg-muted px-1.5 py-0.5 rounded text-sm'>{row.coupon.coupon_code}</code> : '—',
		},
		{
			title: 'Discount',
			render: (row) => formatDiscount(row),
		},
		{
			title: 'Scope',
			render: (row) =>
				row.subscription_line_item_id ? (
					<Chip variant='info' label={t('coupons.scope.lineItem', 'Line Item')} />
				) : (
					<Chip variant='default' label={t('coupons.scope.subscription', 'Subscription')} />
				),
		},
		{
			title: 'Start Date',
			render: (row) => formatDateShort(row.start_date),
		},
		{
			title: 'End Date',
			render: (row) => (row.end_date ? formatDateShort(row.end_date) : 'Forever'),
		},
		...(onRemove
			? [
					{
						fieldVariant: 'interactive' as const,
						render: (row: CouponAssociation) => (
							<Button variant='ghost' size='sm' aria-label={t('form.remove')} onClick={() => onRemove(row)}>
								<TrashIcon className='h-4 w-4 text-destructive' />
							</Button>
						),
					},
				]
			: []),
	];

	return <FlexpriceTable showEmptyRow={true} columns={columns} data={rows} />;
};

export default CouponAssociationTable;
