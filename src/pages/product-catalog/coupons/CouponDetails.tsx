import { Page, Spacer, Chip, Card, CardHeader, Loader } from '@/components/atoms';
import { Detail, ApiDocsContent } from '@/components/molecules';
import { API_DOCS_TAGS } from '@/constants/apiDocsTags';
import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import CouponApi from '@/api/CouponApi';
import { COUPON_TYPE } from '@/types/common/Coupon';
import { ENTITY_STATUS } from '@/models';
import { formatEntityStatus } from '@/utils/common/format_chips';
import formatDate from '@/utils/common/format_date';
import toast from 'react-hot-toast';
import formatCadenceChip from '@/utils/common/format_cadence_chip';
import { formatLocalizedCurrency, formatLocalizedNumber } from '@/utils/common/helper_functions';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';

const CouponDetails = () => {
	const { t } = useTranslation(['catalog', 'common']);
	const { id } = useParams<{ id: string }>();

	const {
		data: coupon,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['fetchCouponDetails', id],
		queryFn: () => CouponApi.getCouponById(id!),
		enabled: !!id,
	});

	const notSet = t('common:labels.notSet');

	const details: Detail[] = useMemo(() => {
		if (!coupon) return [];
		const fields = 'catalog:coupons.details.fields' as const;
		return [
			{
				label: t(`${fields}.type`),
				value: (
					<Chip
						variant='default'
						label={coupon.type === COUPON_TYPE.FIXED ? t('catalog:coupons.drawer.fixedAmount') : t('catalog:coupons.drawer.percentage')}
					/>
				),
			},
			{
				label: t(`${fields}.discount`),
				value:
					coupon.type === COUPON_TYPE.FIXED
						? formatLocalizedCurrency(coupon.amount_off ?? 0, coupon.currency)
						: `${formatLocalizedNumber(coupon.percentage_off ?? 0, { maximumFractionDigits: 2 })}%`,
			},
			{
				label: t(`${fields}.cadence`),
				value: coupon.cadence ? <Chip variant='default' label={formatCadenceChip(coupon.cadence, t)} /> : notSet,
			},
			{
				label: t(`${fields}.status`),
				value: (
					<Chip variant={coupon.status === ENTITY_STATUS.PUBLISHED ? 'success' : 'default'} label={formatEntityStatus(coupon.status, t)} />
				),
			},
			{
				label: t(`${fields}.redemptions`),
				value: `${coupon.total_redemptions}/${coupon.max_redemptions || '∞'}`,
			},
			{
				label: t(`${fields}.durationInPeriods`),
				value: coupon.duration_in_periods?.toString() || notSet,
			},
			{
				label: t(`${fields}.redeemAfter`),
				value: coupon.redeem_after ? formatDate(coupon.redeem_after) : notSet,
			},
			{
				label: t(`${fields}.redeemBefore`),
				value: coupon.redeem_before ? formatDate(coupon.redeem_before) : notSet,
			},
			{
				label: t(`${fields}.createdAt`),
				value: formatDate(coupon.created_at),
			},
			{
				label: t(`${fields}.updatedAt`),
				value: formatDate(coupon.updated_at),
			},
		];
	}, [coupon, notSet, t]);

	if (isLoading) {
		return <Loader />;
	}

	if (isError || !coupon) {
		toast.error('Error loading coupon details');
		return (
			<Page heading={t('common:errors.loadFailedShort')}>
				<div className='flex items-center justify-center h-64'>
					<div className='text-muted-foreground'>{t('catalog:coupons.details.loadError')}</div>
				</div>
			</Page>
		);
	}

	const details: Detail[] = [
		{
			label: 'Type',
			value: (
				<Chip
					variant='default'
					label={coupon.type === COUPON_TYPE.FIXED ? t('catalog:coupons.drawer.fixedAmount') : t('catalog:coupons.drawer.percentage')}
				/>
			),
		},
		{
			label: 'Coupon Code',
			value: coupon.coupon_code ? <code className='font-mono bg-muted px-1.5 py-0.5 rounded text-sm'>{coupon.coupon_code}</code> : '—',
		},
		{
			label: 'Discount',
			value:
				coupon.type === COUPON_TYPE.FIXED
					? `${getCurrencySymbol(coupon.currency)} ${coupon.amount_off || '0.00'}`
					: `${coupon.percentage_off || '0'}%`,
		},
		{
			label: 'Cadence',
			value: coupon.cadence ? <Chip variant='default' label={formatCadenceChip(coupon.cadence)} /> : 'Not set',
		},
		{
			label: 'Status',
			value: <Chip variant={coupon.status === ENTITY_STATUS.PUBLISHED ? 'success' : 'default'} label={formatChips(coupon.status)} />,
		},
		{
			label: 'Redemptions',
			value: `${coupon.total_redemptions}/${coupon.max_redemptions || '∞'}`,
		},
		{
			label: 'Duration in Periods',
			value: coupon.duration_in_periods?.toString() || 'Not set',
		},
		{
			label: 'Redeem After',
			value: coupon.redeem_after ? formatDate(coupon.redeem_after) : 'Not set',
		},
		{
			label: 'Redeem Before',
			value: coupon.redeem_before ? formatDate(coupon.redeem_before) : 'Not set',
		},
		{
			label: 'Created At',
			value: formatDate(coupon.created_at),
		},
		{
			label: 'Updated At',
			value: formatDate(coupon.updated_at),
		},
	];

	if (coupon.metadata && Object.keys(coupon.metadata).length > 0) {
		displayDetails.push({
			label: t('catalog:coupons.details.fields.metadata'),
			value: <pre className='text-sm bg-muted p-3 rounded-md overflow-auto max-h-32'>{JSON.stringify(coupon.metadata, null, 2)}</pre>,
		});
	}

	return (
		<Page documentTitle={coupon.name} heading={coupon.name}>
			<ApiDocsContent tags={API_DOCS_TAGS.Coupons} />

			<Spacer className='!h-6' />

			<div className='space-y-6'>
				<Card variant='notched'>
					<CardHeader title={t('catalog:coupons.details.detailsTitle')} />
					<div className='p-6'>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
							<div className='space-y-4'>
								{displayDetails.slice(0, Math.ceil(displayDetails.length / 2)).map((detail, index) => (
									<div key={index} className='flex flex-col space-y-1'>
										<span className='text-sm font-medium text-muted-foreground'>{detail.label}</span>
										<div className='text-sm'>{detail.value}</div>
									</div>
								))}
							</div>
							<div className='space-y-4'>
								{displayDetails.slice(Math.ceil(displayDetails.length / 2)).map((detail, index) => (
									<div key={index} className='flex flex-col space-y-1'>
										<span className='text-sm font-medium text-muted-foreground'>{detail.label}</span>
										<div className='text-sm'>{detail.value}</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</Card>
			</div>
		</Page>
	);
};

export default CouponDetails;
