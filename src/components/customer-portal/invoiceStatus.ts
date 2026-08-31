import { Invoice, INVOICE_STATUS } from '@/models/Invoice';
import { PAYMENT_STATUS } from '@/constants/payment';

/** An invoice is payable once it is finalized and not already settled or voided. */
export const isPayable = (invoice: Pick<Invoice, 'invoice_status' | 'payment_status'>) =>
	invoice.invoice_status === INVOICE_STATUS.FINALIZED && invoice.payment_status !== PAYMENT_STATUS.SUCCEEDED;
