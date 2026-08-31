import { useTranslation } from 'react-i18next';
import { Copy, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Dialog } from '@/components/atoms';

interface CheckoutLinkDialogProps {
	url: string | null;
	onOpenChange: (open: boolean) => void;
}

/**
 * Fallback for a hosted-checkout hand-off.
 *
 * The portal may be embedded in an iframe or opened where a programmatic redirect
 * is blocked, in which case the customer would be stranded with no way to pay.
 * Showing the URL leaves them a link they can open or copy by hand.
 */
const CheckoutLinkDialog = ({ url, onOpenChange }: CheckoutLinkDialogProps) => {
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
		<Dialog isOpen={url !== null} onOpenChange={onOpenChange} title={t('checkoutLink.title')} description={t('checkoutLink.description')}>
			{url && (
				<div className='space-y-3'>
					<p
						className='text-xs break-all rounded-md p-3'
						style={{ backgroundColor: 'var(--portal-bg, #f4f4f5)', color: 'var(--portal-text-secondary, #71717a)' }}>
						{url}
					</p>
					<div className='flex items-center gap-2'>
						<Button onClick={() => window.open(url, '_blank', 'noopener,noreferrer')} prefixIcon={<ExternalLink />}>
							{t('checkoutLink.open')}
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
