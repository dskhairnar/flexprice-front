import { Invoice, INVOICE_STATUS } from '@/models/Invoice';
import { PAYMENT_STATUS } from '@/constants/payment';

/** An invoice is payable once it is finalized and not already settled or voided. */
export const isPayable = (invoice: Pick<Invoice, 'invoice_status' | 'payment_status'>) =>
	invoice.invoice_status === INVOICE_STATUS.FINALIZED && invoice.payment_status !== PAYMENT_STATUS.SUCCEEDED;

/**
 * Only finalized invoices are the customer's business.
 *
 * A draft is the tenant still deciding what to bill and can still change or be
 * discarded; a voided or skipped one is no longer owed. Showing any of them in
 * the portal invites a customer to pay something that is not yet, or no longer,
 * a bill.
 *
 * Applied client-side: the portal's invoice endpoint builds its own filter from
 * the session's customer and pagination alone, and ignores any filters sent with
 * the request.
 */
export const isCustomerVisible = (invoice: Pick<Invoice, 'invoice_status'>) => invoice.invoice_status === INVOICE_STATUS.FINALIZED;
