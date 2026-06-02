import { FC } from 'react';
import { SubscriptionUsage } from '@/models/Subscription';
import { ColumnData, FlexpriceTable } from '@/components/molecules';
import { FormHeader } from '@/components/atoms';
import { useTranslation } from 'react-i18next';

export interface UsageTableProps {
	data: SubscriptionUsage;
}

const UsageTable: FC<UsageTableProps> = ({ data }) => {
	const { t } = useTranslation(['customers', 'common']);
	const mappedData = (data?.charges ?? []).map((usage) => ({
		name: usage.meter_display_name,
		quantity: usage.quantity,
		amount: usage.display_amount,
	}));

	const columns: ColumnData[] = [
		{
			fieldName: 'name',
			title: t('common:tableColumns.featureName'),
		},
		{
			fieldName: 'quantity',
			title: t('common:tableColumns.quantity'),
		},
		{
			fieldName: 'amount',
			title: t('common:tableColumns.amount'),
		},
	];

	return (
		<div className='rounded-[6px] border border-gray-300  mt-2 p-4'>
			<FormHeader title={t('organisms.usageTable.currentMeterUsage')} variant='sub-header' />
			<div className='rounded-[6px] border border-gray-300  mt-2 '>
				<FlexpriceTable columns={columns} data={mappedData} />
			</div>
		</div>
	);
};

export default UsageTable;
