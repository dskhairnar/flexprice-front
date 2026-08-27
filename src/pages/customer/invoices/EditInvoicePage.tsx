import { FC, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';
import { Button, Checkbox, DateTimePicker, Divider, FormHeader, Input, Loader, Page, Select, Spacer, Textarea } from '@/components/atoms';
import { InvoiceLineItemTable, InvoiceStatusModal } from '@/components/molecules';
import { AddChargesButton } from '@/components/organisms/PlanForm/SetupChargesSection';
import { getPaymentStatusChip, getStatusChip } from '@/components/molecules/InvoiceTable/InvoiceTable';
import RedirectCell from '@/components/molecules/Table/RedirectCell';
import InvoiceApi from '@/api/InvoiceApi';
import { Invoice, INVOICE_STATUS, INVOICE_TYPE } from '@/models/Invoice';
import { PAYMENT_STATUS } from '@/constants/payment';
import {
	ExecuteInvoiceModifyPayload,
	INVOICE_MODIFY_LINE_ITEM_ACTION,
	InvoiceModifyAddLineItem,
	InvoiceModifyUpdateLineItem,
	UpdateInvoicePayload,
} from '@/types/dto';
import { RouteNames } from '@/core/routes/Routes';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { refetchInvoiceQueries } from '@/core/services/tanstack/queryKeys';
import { useBreadcrumbsStore } from '@/store/useBreadcrumbsStore';
import formatDate from '@/utils/common/format_date';
import { cn } from '@/lib/utils';

interface MetadataRow {
	key: string;
	value: string;
}

/** One editable line-item row. Rows without an id are new (to be added on save). */
interface LineItemRow {
	id?: string;
	display_name: string;
	quantity: string;
	amount: string;
}

/** The line-item operations a save must execute through the modify endpoint. */
interface LineItemOps {
	removes: string[];
	updates: { line_item_id: string; update: InvoiceModifyUpdateLineItem }[];
	adds: InvoiceModifyAddLineItem[];
}

const toLineItemRows = (invoice: Invoice): LineItemRow[] =>
	(invoice.line_items ?? []).map((li) => ({
		id: li.id,
		display_name: li.display_name ?? '',
		quantity: String(li.quantity ?? '1'),
		amount: String(li.amount ?? '0'),
	}));

// Backend only accepts updates for invoices in these statuses.
const EDITABLE_STATUSES: string[] = [INVOICE_STATUS.DRAFT, INVOICE_STATUS.FINALIZED];

const toMetadataRows = (invoice: Invoice): MetadataRow[] => {
	const entries = Object.entries(invoice.metadata ?? {}).filter(([, value]) => typeof value === 'string');
	return entries.map(([key, value]) => ({ key, value: value as string }));
};

const rowsToMetadata = (rows: MetadataRow[]): Record<string, string> => {
	const metadata: Record<string, string> = {};
	rows.forEach(({ key, value }) => {
		if (key.trim()) metadata[key.trim()] = value;
	});
	return metadata;
};

const isValidUrl = (value: string): boolean => {
	try {
		const url = new URL(value);
		return url.protocol === 'http:' || url.protocol === 'https:';
	} catch {
		return false;
	}
};

const EditInvoicePage: FC = () => {
	const { t } = useTranslation(['billing', 'common']);
	const { invoiceId } = useParams<{ invoiceId: string }>();
	const navigate = useNavigate();
	const { updateBreadcrumb } = useBreadcrumbsStore();

	const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
	const [pdfUrl, setPdfUrl] = useState('');
	const [metadataRows, setMetadataRows] = useState<MetadataRow[]>([]);
	const [applyDiscount, setApplyDiscount] = useState(false);
	const [paymentStatus, setPaymentStatus] = useState('');
	const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
	const [lineItemRows, setLineItemRows] = useState<LineItemRow[]>([]);
	const [removedLineItemIds, setRemovedLineItemIds] = useState<string[]>([]);

	const {
		data: invoice,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['invoiceEdit', invoiceId],
		queryFn: async () => await InvoiceApi.getInvoiceById(invoiceId!),
		enabled: !!invoiceId,
	});

	// Seed the form whenever a fresh invoice is loaded.
	useEffect(() => {
		if (!invoice) return;
		setDueDate(invoice.due_date ? new Date(invoice.due_date) : undefined);
		setPdfUrl(invoice.invoice_pdf_url ?? '');
		setMetadataRows(toMetadataRows(invoice));
		setApplyDiscount(false);
		setPaymentStatus(invoice.payment_status ?? '');
		setLineItemRows(toLineItemRows(invoice));
		setRemovedLineItemIds([]);
	}, [invoice]);

	useEffect(() => {
		if (invoice?.invoice_number && invoiceId) {
			updateBreadcrumb(2, invoice.invoice_number, `${RouteNames.invoices}/${invoiceId}`);
		}
	}, [invoice?.invoice_number, invoiceId, updateBreadcrumb]);

	const isEditable = !!invoice && EDITABLE_STATUSES.includes(invoice.invoice_status);
	const isDraft = invoice?.invoice_status === INVOICE_STATUS.DRAFT;

	const originalDueDateMs = useMemo(() => (invoice?.due_date ? new Date(invoice.due_date).getTime() : undefined), [invoice]);
	const dueDateChanged = !!invoice && dueDate?.getTime() !== originalDueDateMs;
	const pdfUrlChanged = !!invoice && pdfUrl.trim() !== (invoice.invoice_pdf_url ?? '');
	const metadataChanged = useMemo(() => {
		if (!invoice) return false;
		return JSON.stringify(rowsToMetadata(metadataRows)) !== JSON.stringify(rowsToMetadata(toMetadataRows(invoice)));
	}, [invoice, metadataRows]);

	// The payment endpoint only accepts transitions away from PENDING/FAILED
	// (SUCCEEDED can only move to OVERPAID, which happens via payments, not here).
	const isPaymentStatusEditable =
		isEditable && (invoice?.payment_status === PAYMENT_STATUS.PENDING || invoice?.payment_status === PAYMENT_STATUS.FAILED);
	const paymentStatusChanged = !!invoice && isPaymentStatusEditable && !!paymentStatus && paymentStatus !== invoice.payment_status;

	// Line-item edits go exclusively through POST /invoices/:id/modify/execute (DRAFT only).
	const lineItemOps = useMemo<LineItemOps>(() => {
		if (!invoice || invoice.invoice_status !== INVOICE_STATUS.DRAFT) return { removes: [], updates: [], adds: [] };
		const originalById = new Map((invoice.line_items ?? []).map((li) => [li.id, li]));
		const removes = removedLineItemIds.filter((id) => originalById.has(id));
		const updates: LineItemOps['updates'] = [];
		const adds: InvoiceModifyAddLineItem[] = [];
		lineItemRows.forEach((row) => {
			if (!row.id) {
				// A new row counts once the user typed anything meaningful into it.
				if (row.display_name.trim() !== '' || parseFloat(row.amount || '0') !== 0) {
					adds.push({ display_name: row.display_name.trim(), amount: row.amount || '0', quantity: row.quantity || '1' });
				}
				return;
			}
			const original = originalById.get(row.id);
			if (!original) return;
			const update: InvoiceModifyUpdateLineItem = {};
			if (row.display_name !== (original.display_name ?? '')) update.display_name = row.display_name;
			if (row.amount !== String(original.amount ?? '0')) update.amount = row.amount;
			if (row.quantity !== String(original.quantity ?? '1')) update.quantity = row.quantity;
			if (Object.keys(update).length > 0) updates.push({ line_item_id: row.id, update });
		});
		return { removes, updates, adds };
	}, [invoice, lineItemRows, removedLineItemIds]);

	const lineItemsChanged = lineItemOps.removes.length > 0 || lineItemOps.updates.length > 0 || lineItemOps.adds.length > 0;

	const hasChanges = dueDateChanged || pdfUrlChanged || metadataChanged || applyDiscount || paymentStatusChanged || lineItemsChanged;

	const { mutate: updateInvoice, isPending } = useMutation({
		mutationFn: async ({
			payload,
			nextPaymentStatus,
			ops,
		}: {
			payload: UpdateInvoicePayload | null;
			nextPaymentStatus: string | null;
			ops: LineItemOps | null;
		}) => {
			if (payload) await InvoiceApi.updateInvoice(invoiceId!, payload);
			if (nextPaymentStatus) await InvoiceApi.updateInvoicePaymentStatus(invoiceId!, { payment_status: nextPaymentStatus });
			if (ops) {
				if (ops.removes.length > 0) {
					const payload: ExecuteInvoiceModifyPayload = {
						type: 'line_item',
						line_item_params: { action: INVOICE_MODIFY_LINE_ITEM_ACTION.REMOVE, line_item_ids: ops.removes },
					};
					await InvoiceApi.modifyInvoice(invoiceId!, payload);
				}
				// One update per call: the backend versions each edit individually.
				for (const { line_item_id, update } of ops.updates) {
					const payload: ExecuteInvoiceModifyPayload = {
						type: 'line_item',
						line_item_params: { action: INVOICE_MODIFY_LINE_ITEM_ACTION.UPDATE, line_item_id, update },
					};
					await InvoiceApi.modifyInvoice(invoiceId!, payload);
				}
				if (ops.adds.length > 0) {
					const payload: ExecuteInvoiceModifyPayload = {
						type: 'line_item',
						line_item_params: { action: INVOICE_MODIFY_LINE_ITEM_ACTION.ADD, items: ops.adds },
					};
					await InvoiceApi.modifyInvoice(invoiceId!, payload);
				}
			}
		},
		onSuccess: () => {
			toast.success(t('invoices.edit.toast.updateSuccess'));
			void refetchInvoiceQueries();
			void refetchQueries(['invoiceEdit', invoiceId!]);
			navigate(`${RouteNames.invoices}/${invoiceId}`);
		},
		onError: (error: Error) => {
			toast.error(error.message || t('invoices.edit.toast.updateFailed'));
		},
	});

	const handleSave = () => {
		if (!invoice || !hasChanges || isPending) return;

		const payload: UpdateInvoicePayload = {};
		if (dueDateChanged && dueDate) {
			if (dueDate.getTime() < Date.now()) {
				toast.error(t('invoices.edit.dueDatePast'));
				return;
			}
			payload.due_date = dueDate.toISOString();
		}
		if (pdfUrlChanged) {
			const trimmed = pdfUrl.trim();
			if (trimmed && !isValidUrl(trimmed)) {
				toast.error(t('invoices.edit.pdfUrlInvalid'));
				return;
			}
			payload.invoice_pdf_url = trimmed;
		}
		if (metadataChanged) {
			payload.metadata = rowsToMetadata(metadataRows);
		}
		if (applyDiscount && isDraft) {
			payload.apply_discount = true;
		}

		if (lineItemsChanged) {
			const invalidRow = lineItemRows.some((row) => {
				const touched = !row.id || lineItemOps.updates.some((u) => u.line_item_id === row.id);
				if (!touched) return false;
				if (!row.id && row.display_name.trim() === '' && parseFloat(row.amount || '0') === 0) return false;
				const amount = parseFloat(row.amount);
				const quantity = parseFloat(row.quantity);
				return row.display_name.trim() === '' || isNaN(amount) || amount < 0 || isNaN(quantity) || quantity < 0;
			});
			if (invalidRow) {
				toast.error(t('invoices.edit.lineItemInvalid'));
				return;
			}
		}

		const invoicePayload = Object.keys(payload).length > 0 ? payload : null;
		const nextPaymentStatus = paymentStatusChanged ? paymentStatus : null;
		const ops = lineItemsChanged ? lineItemOps : null;
		if (!invoicePayload && !nextPaymentStatus && !ops) return;

		updateInvoice({ payload: invoicePayload, nextPaymentStatus, ops });
	};

	const handleCancel = () => {
		navigate(`${RouteNames.invoices}/${invoiceId}`);
	};

	const handleMetadataChange = (index: number, field: keyof MetadataRow, value: string) => {
		setMetadataRows((prev) => {
			const rows = [...prev];
			rows[index] = { ...rows[index], [field]: value };
			return rows;
		});
	};

	const handleLineItemChange = (index: number, field: 'display_name' | 'quantity' | 'amount', value: string) => {
		setLineItemRows((prev) => {
			const rows = [...prev];
			rows[index] = { ...rows[index], [field]: value };
			return rows;
		});
	};

	const handleRemoveLineItemRow = (index: number) => {
		setLineItemRows((prev) => {
			const row = prev[index];
			if (row?.id) setRemovedLineItemIds((ids) => (ids.includes(row.id!) ? ids : [...ids, row.id!]));
			return prev.filter((_, i) => i !== index);
		});
	};

	if (isLoading) return <Loader />;

	if (isError || !invoice) {
		toast.error(t('invoices.edit.toast.loadError'));
		return null;
	}

	const na = t('common:labels.na');
	const readonlyLabelClass = 'text-content-zinc text-sm font-medium';
	const readonlyValueClass = 'text-content-zinc-muted text-sm';

	return (
		<Page documentTitle={t('invoices.edit.pageTitle')} heading={t('invoices.edit.pageTitle')}>
			<div className='space-y-6'>
				<InvoiceStatusModal invoice={invoice} isOpen={isStatusModalOpen} onOpenChange={setIsStatusModalOpen} />
				<div className='rounded-xl border border-line bg-transparent p-6'>
					{/* read-only invoice context */}
					<div className='p-4'>
						<div className='flex justify-between items-center'>
							<FormHeader className='!mb-0' title={t('invoices.edit.detailsTitle')} variant='sub-header' titleClassName='font-semibold' />
							{isEditable && (
								<Button variant='outline' onClick={() => setIsStatusModalOpen(true)}>
									{t('invoices.details.updateInvoiceStatus')}
								</Button>
							)}
						</div>
						<Spacer className='!my-6' />
						<div className='w-full grid grid-cols-4 gap-4'>
							<p className={readonlyLabelClass}>{t('invoices.edit.invoiceNumber')}</p>
							<p className={readonlyLabelClass}>{t('invoices.edit.customer')}</p>
							<p className={readonlyLabelClass}>{t('invoices.edit.issueDate')}</p>
							<p className={readonlyLabelClass}>{t('invoices.edit.currency')}</p>
						</div>
						<div className='w-full grid grid-cols-4 gap-4 mt-1'>
							<p className={readonlyValueClass}>{invoice.invoice_number || na}</p>
							<RedirectCell redirectUrl={`${RouteNames.customers}/${invoice.customer_id}`}>
								<p className={readonlyValueClass}>{invoice.customer?.name || na}</p>
							</RedirectCell>
							<p className={readonlyValueClass}>{invoice.issue_date ? formatDate(invoice.issue_date) : na}</p>
							<p className={cn(readonlyValueClass, 'uppercase')}>{invoice.currency || na}</p>
						</div>
						<Spacer className='!my-4' />
						<div className='w-full grid grid-cols-4 gap-4'>
							<p className={readonlyLabelClass}>{t('invoices.edit.status')}</p>
							<p className={readonlyLabelClass}>{t('invoices.edit.paymentStatus')}</p>
						</div>
						<div className='w-full grid grid-cols-4 gap-4 mt-1'>
							<div>{getStatusChip(invoice.invoice_status ?? '', t)}</div>
							<div>{getPaymentStatusChip(invoice.payment_status ?? '', t)}</div>
						</div>
					</div>

					{!isEditable && (
						<div className='mx-4 mb-2 rounded-lg border border-line bg-muted/40 p-4'>
							<p className='text-sm text-content-zinc-muted'>{t('invoices.edit.notEditable')}</p>
						</div>
					)}

					<Divider className='my-4' />

					{/* editable fields */}
					<div className='p-4'>
						<FormHeader title={t('invoices.edit.editableTitle')} variant='sub-header' titleClassName='font-semibold' />
						<div className='mt-6 grid grid-cols-2 gap-6 max-w-3xl'>
							<DateTimePicker
								title={t('invoices.edit.dueDate')}
								date={dueDate}
								setDate={setDueDate}
								placeholder={t('invoices.edit.dueDatePlaceholder')}
								disabled={!isEditable}
							/>
							<Input
								label={t('invoices.edit.pdfUrl')}
								value={pdfUrl}
								onChange={setPdfUrl}
								placeholder={t('invoices.edit.pdfUrlPlaceholder')}
								disabled={!isEditable}
							/>
							<Select
								label={t('invoices.edit.paymentStatus')}
								value={paymentStatus}
								options={[
									{ value: PAYMENT_STATUS.PENDING, label: t('invoices.details.paymentStatusModal.pendingLabel') },
									{ value: PAYMENT_STATUS.SUCCEEDED, label: t('invoices.details.paymentStatusModal.succeededLabel') },
									{ value: PAYMENT_STATUS.FAILED, label: t('invoices.details.paymentStatusModal.failedLabel') },
								]}
								onChange={setPaymentStatus}
								disabled={!isPaymentStatusEditable}
								description={!isPaymentStatusEditable && isEditable ? t('invoices.edit.paymentStatusLockedHint') : undefined}
							/>
						</div>
						{isDraft && (
							<div className='mt-6'>
								<Checkbox
									id='apply-discount'
									checked={applyDiscount}
									onCheckedChange={(checked) => setApplyDiscount(!!checked)}
									label={t('invoices.edit.applyDiscount')}
									description={t('invoices.edit.applyDiscountDescription')}
								/>
							</div>
						)}
					</div>

					<Divider className='my-4' />

					{/* metadata */}
					<div className='p-4'>
						<FormHeader title={t('invoices.edit.metadata')} variant='sub-header' titleClassName='font-semibold' />
						<div className='mt-6 flex flex-col gap-4 max-w-3xl'>
							{metadataRows.map((row, index) => (
								<div key={index} className='flex gap-2 items-start'>
									<div className='flex-[3] min-w-0'>
										<Input
											placeholder={t('common:form.key')}
											value={row.key}
											onChange={(value) => handleMetadataChange(index, 'key', value)}
											disabled={!isEditable}
										/>
									</div>
									<div className='flex-[5] min-w-0'>
										<Textarea
											placeholder={t('common:form.value')}
											value={row.value}
											onChange={(value) => handleMetadataChange(index, 'value', value)}
											textAreaClassName='min-h-6 h-6 rounded-md'
											className='rounded-md'
											disabled={!isEditable}
										/>
									</div>
									<Button
										variant='ghost'
										className='size-10'
										onClick={() => setMetadataRows((prev) => prev.filter((_, i) => i !== index))}
										disabled={!isEditable}
										aria-label={t('common:form.remove')}>
										<Trash2 className='size-5' />
									</Button>
								</div>
							))}
							{isEditable && (
								<div>
									<AddChargesButton
										onClick={() => setMetadataRows((prev) => [...prev, { key: '', value: '' }])}
										label={t('common:form.addAnotherItem')}
									/>
								</div>
							)}
						</div>
					</div>

					<Divider className='my-4' />

					{/* line items — editable for drafts through the invoice modify API */}
					{isDraft ? (
						<div className='p-4'>
							<FormHeader title={t('invoices.edit.lineItemsTitle')} variant='sub-header' titleClassName='font-semibold' />
							<p className='text-sm text-content-zinc-muted mt-1 mb-4'>{t('invoices.edit.manualEditHint')}</p>
							<div className='min-w-0'>
								{lineItemRows.map((row, index) => (
									<div key={row.id ?? `new-${index}`} className='mb-4 grid grid-cols-12 items-end gap-3 min-w-0'>
										<div className='col-span-12 min-w-0 sm:col-span-5'>
											<Input
												label={index === 0 ? t('createInvoice.itemName') : ''}
												value={row.display_name}
												onChange={(value) => handleLineItemChange(index, 'display_name', value)}
												placeholder={t('createInvoice.itemNamePlaceholder')}
											/>
										</div>
										<div className='col-span-4 min-w-0 sm:col-span-3'>
											<Input
												label={index === 0 ? t('createInvoice.quantity') : ''}
												value={row.quantity}
												onChange={(value) => handleLineItemChange(index, 'quantity', value)}
												variant='integer'
												placeholder='1'
											/>
										</div>
										<div className='col-span-4 min-w-0 sm:col-span-3'>
											<Input
												label={index === 0 ? t('createInvoice.amount') : ''}
												value={row.amount}
												onChange={(value) => handleLineItemChange(index, 'amount', value)}
												variant='formatted-number'
												placeholder={t('creditNotes.amountPlaceholder')}
											/>
										</div>
										<div className='col-span-1 flex items-end justify-end'>
											<Button variant='outline' className='size-[42px] shrink-0' onClick={() => handleRemoveLineItemRow(index)}>
												<Trash2 className='w-4 h-4' />
											</Button>
										</div>
									</div>
								))}
								<AddChargesButton
									onClick={() => setLineItemRows((prev) => [...prev, { display_name: '', quantity: '1', amount: '0' }])}
									label={t('createInvoice.addLineItem')}
								/>
							</div>
						</div>
					) : (
						<div className='px-4 pb-4'>
							<p className='text-sm text-content-zinc-muted mb-2'>{t('invoices.edit.lineItemsDraftOnlyNote')}</p>
							<InvoiceLineItemTable
								title={t('invoices.edit.lineItemsTitle')}
								data={invoice.line_items ?? []}
								subtotal={invoice.subtotal}
								total={invoice.total}
								total_prepaid_credits_applied={invoice.total_prepaid_credits_applied}
								discount={invoice.total_discount}
								total_tax={invoice.total_tax}
								amount_paid={invoice.amount_paid}
								overpaid_amount={invoice.overpaid_amount}
								amount_remaining={Number(invoice.amount_remaining)}
								amount_due={invoice.amount_due}
								currency={invoice.currency}
								invoiceType={invoice.invoice_type as INVOICE_TYPE}
							/>
						</div>
					)}
				</div>

				<div className='flex justify-end p-4'>
					<Button variant='outline' className='mr-4' onClick={handleCancel}>
						{t('common:actions.cancel')}
					</Button>
					{isEditable && (
						<Button onClick={handleSave} disabled={!hasChanges || isPending}>
							{isPending ? t('invoices.edit.saving') : t('invoices.edit.saveChanges')}
						</Button>
					)}
				</div>
			</div>
		</Page>
	);
};

export default EditInvoicePage;
