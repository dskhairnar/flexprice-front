import { FormHeader } from '@/components/atoms';
import { CreditNoteLineItem } from '@/models/CreditNote';
import { formatLocalizedCurrency, formatLocalizedNumber, resolveCurrencyCode } from '@/utils/common/helper_functions';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
	data: CreditNoteLineItem[];
	currency?: string;
	total_amount?: number;
	sub_total?: number;
	tax?: number;
	title?: string;
	total_label?: string;
}

const CreditNoteLineItemTable: FC<Props> = ({ data, total_amount, currency, title, sub_total, tax, total_label }) => {
	const { t } = useTranslation(['billing', 'common']);
	const li = 'invoices.details.lineItemsTable';
	const resolvedCurrency = resolveCurrencyCode(currency);

	if (data.length === 0) {
		return <div></div>;
	}

	return (
		<div>
			<div className='w-full p-4 '>
				<FormHeader className='!mb-0' title={title} variant='form-component-title' titleClassName='font-medium' />
				<div className='overflow-x-auto'>
					<table className='table-auto w-full border-collapse text-start text-sm text-gray-800 my-4 px-4'>
						<thead className='border-b border-gray-200'>
							<tr>
								<th className='py-2 px-2 text-gray-600 font-semibold text-sm'>{t('creditNotes.lineItemTable.name')}</th>
								<th className='py-2 px-2 text-gray-600 text-end font-semibold text-sm'>{t('creditNotes.lineItemTable.creditAmount')}</th>
							</tr>
						</thead>
						<tbody>
							{data?.map((item, index) => {
								return (
									<tr key={item.id || index}>
										<td className='py-3 px-2 text-gray-800'>{item.display_name ?? t('common:labels.na')}</td>
										<td className='py-3 px-2 text-end text-[#2A9D90] tabular-nums'>
											{formatLocalizedCurrency(item.amount ?? 0, item.currency ?? resolvedCurrency)}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>

				<div className='flex justify-end px-[6px]  py-4 border-t border-gray-200'>
					<div className='text-sm text-gray-800 space-y-4 w-1/3'>
						{sub_total !== undefined && (
							<div className='flex justify-between'>
								<span>{t(`${li}.subtotal`)}</span>
								<span className='text-[#2A9D90] tabular-nums'>{formatLocalizedCurrency(Number(sub_total), resolvedCurrency)}</span>
							</div>
						)}
						{tax !== undefined && (
							<div className='flex justify-between'>
								<span>{t(`${li}.tax`)}</span>
								<span className='tabular-nums'>{tax != null ? formatLocalizedNumber(tax) : t('common:labels.na')}</span>
							</div>
						)}
						{(sub_total !== undefined || tax !== undefined) && <div className=' border-t '></div>}
						<div className='flex justify-between font-semibold text-gray-900 '>
							<span>{total_label || t('creditNotes.totalCreditAmount')}</span>
							<span className='text-[#2A9D90] tabular-nums'>{formatLocalizedCurrency(Number(total_amount ?? 0), resolvedCurrency)}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default CreditNoteLineItemTable;
