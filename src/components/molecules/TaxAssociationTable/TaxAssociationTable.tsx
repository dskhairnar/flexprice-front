import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import FlexpriceTable, { ColumnData, RedirectCell } from '../Table';
import { TaxAssociationResponse } from '@/types/dto/tax';
import { Chip, ActionButton } from '@/components/atoms';
import { formatDateShort } from '@/utils/common/helper_functions';
import TaxApi from '@/api/TaxApi';
import { formatEntityStatus } from '@/utils/common/format_chips';
import { RouteNames } from '@/core/routes/Routes';
import { ENTITY_STATUS } from '@/models/base';

interface Props {
	data: TaxAssociationResponse[];
	onEdit?: (taxAssociation: TaxAssociationResponse) => void;
	showDelete?: boolean;
}

const TaxAssociationTable: FC<Props> = ({ data, onEdit, showDelete = true }) => {
	const { t } = useTranslation('common');
	const columns: ColumnData<TaxAssociationResponse>[] = [
		{
			title: t('tableColumns.taxId'),
			render: (row) => (
				<RedirectCell redirectUrl={`${RouteNames.taxes}/${row.tax_rate_id}`}>{row.tax_rate?.name || row.tax_rate_id}</RedirectCell>
			),
		},
		{
			title: t('tableColumns.priority'),
			render: (row) => row.priority,
		},
		{
			title: t('tableColumns.autoApply'),
			render: (row) => <Chip variant={row.auto_apply ? 'success' : 'default'} label={row.auto_apply ? t('labels.yes') : t('labels.no')} />,
		},
		{
			title: t('tableColumns.currency'),
			render: (row) => row.currency,
		},
		{
			title: t('tableColumns.status'),
			render: (row) => {
				const label = formatEntityStatus(row?.status ?? '', t);
				return <Chip variant={row?.status === ENTITY_STATUS.PUBLISHED ? 'success' : 'default'} label={label} />;
			},
		},
		{
			title: t('tableColumns.created'),
			render: (row) => formatDateShort(row.created_at),
		},
		{
			fieldVariant: 'interactive',
			render(row) {
				return (
					<ActionButton
						id={row?.id}
						deleteMutationFn={async () => {
							return await TaxApi.deleteTaxAssociation(row?.id);
						}}
						refetchQueryKey='fetchTaxAssociations'
						entityName={`Tax Association ${row?.id}`}
						edit={{
							enabled: true,
							onClick: () => onEdit?.(row),
						}}
						archive={{
							enabled: !showDelete,
						}}
					/>
				);
			},
		},
	];

	return (
		<div>
			<FlexpriceTable showEmptyRow={true} columns={columns} data={data} />
		</div>
	);
};

export default TaxAssociationTable;
