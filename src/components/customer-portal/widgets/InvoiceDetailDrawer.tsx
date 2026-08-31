import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Download, Loader2 } from 'lucide-react';
import CustomerPortalApi from '@/api/CustomerPortalApi';
import { Button, Chip, Sheet } from '@/components/atoms';
import { formatAmount } from '@/components/atoms/Input/Input';
import { Invoice, INVOICE_STATUS } from '@/models/Invoice';
import { PAYMENT_STATUS } from '@/constants/payment';
import { formatDateShort, getCurrencySymbol } from '@/utils/common/helper_functions';
import { portalInvoiceQueryKey } from '../queryKeys';
import { isPayable } from '../invoiceStatus';

interface InvoiceDetailDrawerProps {
	/** Row the drawer was opened from; used for an instant header before the full fetch lands. */
	invoice: Invoice | null;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onDownload: (invoice: Invoice) => void;
	isDownloading?: boolean;
}

const StatusChip = ({ invoice }: { invoice: Invoice }) => {
	const { t } = useTranslation('customer-portal');
	if (invoice.payment_status === PAYMENT_STATUS.SUCCEEDED) return <Chip label={t('invoiceChip.paid')} variant='success' />;
	if (invoice.invoice_status === INVOICE_STATUS.VOIDED) return <Chip label={t('invoiceChip.voided')} variant='default' />;
	if (invoice.invoice_status === INVOICE_STATUS.DRAFT) return <Chip label={t('invoiceChip.draft')} variant='default' />;
	if (new Date(invoice.due_date) < new Date()) return <Chip label={t('invoiceChip.overdue')} variant='failed' />;
	return <Chip label={t('invoiceChip.pending')} variant='warning' />;
};

/** Compact label/value row — dividers instead of nested cards, per the portal's linear layout. */
const MetaRow = ({ label, value }: { label: string; value: string }) => (
	<div className='flex items-baseline justify-between gap-4 py-2'>
		<span className='text-sm' style={{ color: 'var(--portal-text-secondary, #71717a)' }}>
			{label}
		</span>
		<span className='text-sm text-end' style={{ color: 'var(--portal-text-primary, #09090b)' }}>
			{value}
		</span>
	</div>
);

const TotalRow = ({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) => (
	<div className='flex items-baseline justify-between gap-4 py-1.5'>
		<span
			className={emphasis ? 'text-sm font-medium' : 'text-sm'}
			style={{ color: emphasis ? 'var(--portal-text-primary, #09090b)' : 'var(--portal-text-secondary, #71717a)' }}>
			{label}
		</span>
		<span className={emphasis ? 'text-sm font-semibold' : 'text-sm'} style={{ color: 'var(--portal-text-primary, #09090b)' }}>
			{value}
		</span>
	</div>
);

/**
 * Invoice detail as a right-hand drawer.
 *
 * Reads the full invoice (line items, taxes, totals) from the portal's existing
 * GET /invoices/:id, which returns the breakdown the list response omits.
 */
const InvoiceDetailDrawer = ({ invoice, isOpen, onOpenChange, onDownload, isDownloading }: InvoiceDetailDrawerProps) => {
	const { t } = useTranslation('customer-portal');

	const { data, isLoading } = useQuery({
		queryKey: portalInvoiceQueryKey(invoice?.id),
		queryFn: () => CustomerPortalApi.getInvoice(invoice!.id),
		enabled: isOpen && !!invoice?.id,
	});

	// Fall back to the list row so the drawer has a header while the detail loads.
	const detail = data ?? invoice;
	const symbol = getCurrencySymbol(detail?.currency ?? 'USD');
	const money = (value?: number) => `${symbol}${formatAmount(String(value ?? 0))}`;

	const title = detail ? detail.invoice_number || t('invoices.numberPrefix', { id: detail.id.slice(0, 8) }) : t('invoiceDetail.title');

	return (
		<Sheet isOpen={isOpen} onOpenChange={onOpenChange} title={title} size='xl'>
			{!detail ? null : (
				<div className='space-y-6 pt-2'>
					{/* Amount owed leads — the customer's first question is what they owe. */}
					<div>
						<div className='flex items-center gap-3 mb-1'>
							<StatusChip invoice={detail} />
						</div>
						<p className='text-3xl font-semibold' style={{ color: 'var(--portal-text-primary, #09090b)' }}>
							{money(detail.amount_remaining > 0 ? detail.amount_remaining : detail.total)}
						</p>
						<p className='text-sm mt-1' style={{ color: 'var(--portal-text-secondary, #71717a)' }}>
							{detail.amount_remaining > 0 ? t('invoiceDetail.amountDue') : t('invoiceDetail.amountTotal')}
						</p>
					</div>

					<div className='divide-y' style={{ borderColor: 'var(--portal-border, #E9E9E9)' }}>
						{detail.period_start && detail.period_end && (
							<MetaRow
								label={t('invoiceDetail.billingPeriod')}
								value={`${formatDateShort(detail.period_start)} – ${formatDateShort(detail.period_end)}`}
							/>
						)}
						<MetaRow label={t('invoiceDetail.issued')} value={formatDateShort(detail.finalized_at || detail.created_at)} />
						{detail.due_date && <MetaRow label={t('invoiceDetail.dueDate')} value={formatDateShort(detail.due_date)} />}
					</div>

					<div>
						<h4 className='text-sm font-medium mb-2' style={{ color: 'var(--portal-text-primary, #09090b)' }}>
							{t('invoiceDetail.lineItems')}
						</h4>
						{isLoading && !data ? (
							<div className='animate-pulse space-y-2'>
								{[1, 2, 3].map((i) => (
									<div key={i} className='h-8 bg-zinc-100 rounded'></div>
								))}
							</div>
						) : detail.line_items?.length ? (
							<div className='divide-y' style={{ borderColor: 'var(--portal-border, #E9E9E9)' }}>
								{detail.line_items.map((item) => (
									<div key={item.id} className='flex items-baseline justify-between gap-4 py-2'>
										<div className='min-w-0'>
											<p className='text-sm truncate' style={{ color: 'var(--portal-text-primary, #09090b)' }}>
												{item.display_name || item.id}
											</p>
											{item.quantity && (
												<p className='text-xs' style={{ color: 'var(--portal-text-secondary, #71717a)' }}>
													{t('invoiceDetail.quantity', { quantity: item.quantity })}
												</p>
											)}
										</div>
										<span className='text-sm shrink-0' style={{ color: 'var(--portal-text-primary, #09090b)' }}>
											{money(item.amount)}
										</span>
									</div>
								))}
							</div>
						) : (
							<p className='text-sm py-2' style={{ color: 'var(--portal-text-secondary, #71717a)' }}>
								{t('invoiceDetail.noLineItems')}
							</p>
						)}
					</div>

					<div className='pt-4' style={{ borderTop: '1px solid var(--portal-border, #E9E9E9)' }}>
						<TotalRow label={t('invoiceDetail.subtotal')} value={money(detail.subtotal)} />
						{!!detail.total_discount && <TotalRow label={t('invoiceDetail.discount')} value={`−${money(detail.total_discount)}`} />}
						{!!detail.total_tax && <TotalRow label={t('invoiceDetail.tax')} value={money(detail.total_tax)} />}
						<TotalRow label={t('invoiceDetail.total')} value={money(detail.total)} emphasis />
						{!!detail.amount_paid && <TotalRow label={t('invoiceDetail.amountPaid')} value={money(detail.amount_paid)} />}
						{detail.amount_remaining > 0 && (
							<TotalRow label={t('invoiceDetail.amountDue')} value={money(detail.amount_remaining)} emphasis />
						)}
					</div>

					<div className='flex items-center gap-2 pt-2'>
						{isPayable(detail) && (
							// Presentational only: no online payment path exists yet. When the
							// backend returns a payment URL this becomes the redirect trigger.
							<Button disabled title={t('invoiceDetail.payUnavailableHint')}>
								{t('invoices.pay')}
							</Button>
						)}
						{detail.invoice_status === INVOICE_STATUS.FINALIZED && (
							<Button variant='outline' onClick={() => onDownload(detail)} disabled={isDownloading}>
								{isDownloading ? <Loader2 className='h-4 w-4 animate-spin' /> : <Download className='h-4 w-4' />}
								{t('invoiceDetail.download')}
							</Button>
						)}
					</div>
					{isPayable(detail) && (
						<p className='text-xs' style={{ color: 'var(--portal-text-secondary, #71717a)' }}>
							{t('invoiceDetail.payUnavailableHint')}
						</p>
					)}
				</div>
			)}
		</Sheet>
	);
};

export default InvoiceDetailDrawer;
