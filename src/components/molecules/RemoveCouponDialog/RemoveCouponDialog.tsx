import { FC, useState, useCallback } from 'react';
import { Button } from '@/components/atoms';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import SubscriptionApi from '@/api/SubscriptionApi';
import { SUBSCRIPTION_MODIFY_TYPE, SUB_MODIFY_COUPON_ACTION } from '@/models';
import type { ChangedResources } from '@/types/dto/Subscription';
import type { CouponAssociation } from '@/models/CouponAssociation';
import { Trans, useTranslation } from 'react-i18next';

type Step = 'confirm' | 'preview';

interface Props {
	subscriptionId: string;
	association: CouponAssociation;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

const RemoveCouponDialog: FC<Props> = ({ subscriptionId, association, open, onOpenChange, onSuccess }) => {
	const { t } = useTranslation(['billing', 'common']);
	const [step, setStep] = useState<Step>('confirm');
	const [previewResult, setPreviewResult] = useState<ChangedResources | null>(null);
	const [isPreviewing, setIsPreviewing] = useState(false);
	const [isRemoving, setIsRemoving] = useState(false);

	const buildPayload = useCallback(() => {
		return {
			type: SUBSCRIPTION_MODIFY_TYPE.COUPON,
			coupon_params: {
				action: SUB_MODIFY_COUPON_ACTION.REMOVE,
				association_id: association.id,
			},
		};
	}, [association.id]);

	const handlePreview = useCallback(async () => {
		setIsPreviewing(true);
		try {
			const result = await SubscriptionApi.previewSubscriptionModify(subscriptionId, buildPayload());
			setPreviewResult(result.changed_resources ?? null);
			setStep('preview');
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Preview failed';
			toast.error(message);
		} finally {
			setIsPreviewing(false);
		}
	}, [subscriptionId, buildPayload]);

	const handleRemove = useCallback(async () => {
		setIsRemoving(true);
		try {
			await SubscriptionApi.executeSubscriptionModify(subscriptionId, buildPayload());
			toast.success('Coupon removed successfully');
			onSuccess();
			onOpenChange(false);
			setStep('confirm');
			setPreviewResult(null);
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Remove failed';
			toast.error(message);
		} finally {
			setIsRemoving(false);
		}
	}, [subscriptionId, buildPayload, onSuccess, onOpenChange]);

	const handleBack = useCallback(() => {
		setStep('confirm');
		setPreviewResult(null);
	}, []);

	const handleOpenChange = useCallback(
		(value: boolean) => {
			if (!value) {
				setStep('confirm');
				setPreviewResult(null);
			}
			onOpenChange(value);
		},
		[onOpenChange],
	);

	const couponName = association.coupon?.name ?? association.coupon_id;
	const couponCode = association.coupon?.coupon_code;

	const hasInvoices = (previewResult?.invoices?.length ?? 0) > 0;
	const hasLineItems = (previewResult?.line_items?.length ?? 0) > 0;
	const hasNoBillingImpact = previewResult !== null && !hasInvoices && !hasLineItems;

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className='w-full max-w-md bg-white'>
				<DialogHeader>
					<DialogTitle>{t('subscriptions.removeCouponDialog.title')}</DialogTitle>
				</DialogHeader>

				{step === 'confirm' && (
					<div className='py-2'>
						<p className='text-sm text-zinc-700'>
							<Trans
								ns='billing'
								i18nKey={
									couponCode ? 'subscriptions.removeCouponDialog.confirmMessageWithCode' : 'subscriptions.removeCouponDialog.confirmMessage'
								}
								values={{ name: couponName, code: couponCode }}
								components={{ bold: <span className='font-medium' /> }}
							/>
						</p>
					</div>
				)}

				{step === 'preview' && (
					<div className='space-y-4 py-2'>
						<p className='text-sm font-medium text-zinc-700'>{t('subscriptions.modifyDialog.previewHeading')}</p>
						{hasNoBillingImpact && <p className='text-sm text-muted-foreground'>{t('subscriptions.modifyDialog.noBillingImpact')}</p>}
						{hasInvoices && (
							<div className='space-y-1'>
								<p className='text-xs font-medium text-zinc-500 uppercase tracking-wide'>
									{t('subscriptions.modifyDialog.invoicesAffected')}
								</p>
								<ul className='space-y-1'>
									{previewResult?.invoices?.map((inv) => (
										<li key={inv.id} className='text-sm text-zinc-700'>
											{inv.id} — {inv.action}
										</li>
									))}
								</ul>
							</div>
						)}
						{hasLineItems && (
							<div className='space-y-1'>
								<p className='text-xs font-medium text-zinc-500 uppercase tracking-wide'>
									{t('subscriptions.modifyDialog.lineItemsAffected')}
								</p>
								<ul className='space-y-1'>
									{previewResult?.line_items?.map((li) => (
										<li key={li.id} className='text-sm text-zinc-700'>
											{li.id} — {li.change_action}
										</li>
									))}
								</ul>
							</div>
						)}
					</div>
				)}

				<DialogFooter>
					{step === 'confirm' && (
						<>
							<Button variant='outline' onClick={() => handleOpenChange(false)} className='flex-1'>
								{t('common:actions.cancel')}
							</Button>
							<Button variant='destructive' onClick={handlePreview} isLoading={isPreviewing} className='flex-1'>
								{t('subscriptions.quantityModify.preview')}
							</Button>
						</>
					)}
					{step === 'preview' && (
						<>
							<Button variant='outline' onClick={handleBack} className='flex-1'>
								{t('common:actions.back')}
							</Button>
							<Button variant='destructive' onClick={handleRemove} isLoading={isRemoving} className='flex-1'>
								{t('subscriptions.coupon.remove')}
							</Button>
						</>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default RemoveCouponDialog;
