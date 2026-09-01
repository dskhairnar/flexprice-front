import { useTranslation } from 'react-i18next';
import { Copy, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Dialog } from '@/components/atoms';
import { openPaymentUrl } from '@/utils/common/openPaymentUrl';

interface CheckoutLinkDialogProps {
	url: string | null;
	onOpenChange: (open: boolean) => void;
	/**
	 * What the link leads to. Adding a card is not a payment, and telling a
	 * customer to "complete your payment" when no money is involved is wrong.
	 */
	purpose?: 'payment' | 'setup';
}

/**
 * Fallback for a hosted-checkout hand-off.
 *
 * The portal may be embedded in an iframe or opened where a programmatic redirect
 * is blocked, in which case the customer would be stranded with no way to pay.
 * Showing the URL leaves them a link they can open or copy by hand.
 */
const CheckoutLinkDialog = ({ url, onOpenChange, purpose = 'payment' }: CheckoutLinkDialogProps) => {
	const { t } = useTranslation('customer-portal');

	const copy = async () => {
		if (!url) return;
		try {
			await navigator.clipboard.writeText(url);
			toast.success(t('checkoutLink.copied'));
		} catch {
			toast.error(t('checkoutLink.copyFailed'));
		}
	};

	return (
		<Dialog
			isOpen={url !== null}
			onOpenChange={onOpenChange}
			title={t(`checkoutLink.${purpose}Title`)}
			description={t(`checkoutLink.${purpose}Description`)}>
			{url && (
				<div className='space-y-3'>
					<p
						className='text-xs break-all rounded-md p-3'
						style={{ backgroundColor: 'var(--portal-bg, #f4f4f5)', color: 'var(--portal-text-secondary, #71717a)' }}>
						{url}
					</p>
					<div className='flex items-center gap-2'>
						<Button onClick={() => openPaymentUrl(url)} prefixIcon={<ExternalLink />}>
							{t(`checkoutLink.${purpose}Open`)}
						</Button>
						<Button variant='outline' onClick={copy} prefixIcon={<Copy />}>
							{t('checkoutLink.copy')}
						</Button>
					</div>
				</div>
			)}
		</Dialog>
	);
};

export default CheckoutLinkDialog;
