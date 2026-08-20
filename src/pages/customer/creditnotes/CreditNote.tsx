import { AddButton, CardHeader, Loader, NoDataCard, Tooltip } from '@/components/atoms';
import { useCurrentUserPermissions } from '@/hooks/useCurrentUserPermissions';
import { ApiDocsContent } from '@/components/molecules';
import { API_DOCS_TAGS } from '@/constants/apiDocsTags';
import { CreditNoteTable } from '@/components/molecules/CreditNoteTable';
import CreditNoteApi from '@/api/CreditNoteApi';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams, useOutletContext } from 'react-router';
import { Card } from '@/components/atoms';
import { RouteNames } from '@/core/routes/Routes';
import { useTranslation } from 'react-i18next';

const CreditNote = () => {
	const { t } = useTranslation('billing');
	const { id: customerId } = useParams();
	const navigate = useNavigate();
	const { can } = useCurrentUserPermissions();
	// Creating a credit note happens via the invoice's own credit-note route (already gated on
	// 'invoice' write), so this navigation-only button matches that permission rather than 'creditnote'.
	const canCreateCreditNote = can('invoice', 'write');

	const { data, isLoading } = useQuery({
		queryKey: ['customerCreditNotes', customerId],
		queryFn: async () => {
			// Fetch credit notes for the customer's invoices
			return await CreditNoteApi.getCreditNotes({
				expand: 'invoice,invoice.customer',
			});
		},
		enabled: !!customerId,
		select: (data) => {
			// Filter credit notes for this customer
			const filteredItems = data.items.filter((creditNote) => creditNote.invoice?.customer?.id === customerId);
			return {
				...data,
				items: filteredItems,
			};
		},
	});

	const { isArchived } = useOutletContext<{ isArchived: boolean }>();

	if (isLoading) {
		return <Loader />;
	}

	const goToInvoiceTab = () => navigate(`${RouteNames.customers}/${customerId}/invoice`);

	const addCreditNoteCta =
		!isArchived &&
		(canCreateCreditNote ? (
			<AddButton label={t('creditNotes.addCreditNote')} onClick={goToInvoiceTab} />
		) : (
			<Tooltip content={t('creditNotes.writeDeniedTooltip')}>
				<span tabIndex={0} className='inline-block'>
					<AddButton label={t('creditNotes.addCreditNote')} disabled />
				</span>
			</Tooltip>
		));

	if (data?.items?.length === 0) {
		return <NoDataCard title={t('creditNotes.title')} subtitle={t('creditNotes.empty')} cta={addCreditNoteCta} />;
	}

	return (
		<div>
			<ApiDocsContent tags={API_DOCS_TAGS.CreditNotes} />
			<Card variant='notched'>
				<CardHeader title={t('creditNotes.title')} cta={addCreditNoteCta} />
				<CreditNoteTable data={data?.items ?? []} />
			</Card>
		</div>
	);
};

export default CreditNote;
