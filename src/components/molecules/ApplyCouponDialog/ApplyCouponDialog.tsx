import { FC, useState, useCallback } from 'react';
import { Button, Input, DatePicker } from '@/components/atoms';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toast from 'react-hot-toast';
import SubscriptionApi from '@/api/SubscriptionApi';
import type { SubscriptionLineItemResponse } from '@/types/dto/Subscription';
import { SUBSCRIPTION_MODIFY_TYPE } from '@/types/dto/Subscription';
import { useTranslation } from 'react-i18next';

type CouponScope = 'subscription' | 'line_item';

interface Props {
	subscriptionId: string;
	lineItems: SubscriptionLineItemResponse[];
	prefilledLineItemId?: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

const ApplyCouponDialog: FC<Props> = ({ subscriptionId, lineItems, prefilledLineItemId, open, onOpenChange, onSuccess }) => {
	const { t } = useTranslation(['billing', 'common']);
	const [couponCode, setCouponCode] = useState('');
	const [scope, setScope] = useState<CouponScope>(prefilledLineItemId ? 'line_item' : 'subscription');
	const [selectedLineItemId, setSelectedLineItemId] = useState<string>(prefilledLineItemId ?? '');
	const [startDate, setStartDate] = useState<Date | undefined>(undefined);
	const [endDate, setEndDate] = useState<Date | undefined>(undefined);
	const [isApplying, setIsApplying] = useState(false);

	const buildPayload = useCallback(() => {
		return {
			type: SUBSCRIPTION_MODIFY_TYPE.COUPON,
			coupon_params: {
				action: 'add' as const,
				coupon_code: couponCode,
				...(scope === 'line_item' && selectedLineItemId ? { subscription_line_item_id: selectedLineItemId } : {}),
				...(startDate ? { start_date: startDate.toISOString() } : {}),
				...(endDate ? { end_date: endDate.toISOString() } : {}),
			},
		};
	}, [couponCode, scope, selectedLineItemId, startDate, endDate]);

	const handleApply = useCallback(async () => {
		setIsApplying(true);
		try {
			await SubscriptionApi.executeSubscriptionModify(subscriptionId, buildPayload());
			toast.success('Coupon applied successfully');
			onSuccess();
			onOpenChange(false);
			setCouponCode('');
			setScope(prefilledLineItemId ? 'line_item' : 'subscription');
			setSelectedLineItemId(prefilledLineItemId ?? '');
			setStartDate(undefined);
			setEndDate(undefined);
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Apply failed';
			toast.error(message);
		} finally {
			setIsApplying(false);
		}
	}, [subscriptionId, buildPayload, onSuccess, onOpenChange, prefilledLineItemId]);

	const handleOpenChange = useCallback(
		(value: boolean) => {
			if (!value) {
				setCouponCode('');
				setScope(prefilledLineItemId ? 'line_item' : 'subscription');
				setSelectedLineItemId(prefilledLineItemId ?? '');
				setStartDate(undefined);
				setEndDate(undefined);
			}
			onOpenChange(value);
		},
		[onOpenChange, prefilledLineItemId],
	);

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className='w-full max-w-md bg-white'>
				<DialogHeader>
					<DialogTitle>{t('subscriptions.applyCouponDialog.title')}</DialogTitle>
				</DialogHeader>

				<div className='space-y-4 py-2'>
					<Input
						id='coupon-code'
						label={t('subscriptions.applyCouponDialog.couponCodeLabel')}
						placeholder={t('subscriptions.applyCouponDialog.couponCodePlaceholder')}
						value={couponCode}
						onChange={(value: string) => setCouponCode(value)}
						required
					/>

					<div className='space-y-2'>
						<Label className='text-sm font-medium'>{t('subscriptions.applyCouponDialog.applyToLabel')}</Label>
						<RadioGroup value={scope} onValueChange={(value) => setScope(value as CouponScope)} disabled={!!prefilledLineItemId}>
							<div className='flex items-center space-x-2'>
								<RadioGroupItem value='subscription' id='scope-subscription' disabled={!!prefilledLineItemId} />
								<Label htmlFor='scope-subscription' className='font-normal cursor-pointer'>
									{t('subscriptions.applyCouponDialog.subscriptionLevel')}
								</Label>
							</div>
							<div className='flex items-center space-x-2'>
								<RadioGroupItem value='line_item' id='scope-line-item' disabled={!!prefilledLineItemId} />
								<Label htmlFor='scope-line-item' className='font-normal cursor-pointer'>
									{t('subscriptions.applyCouponDialog.lineItemLevel')}
								</Label>
							</div>
						</RadioGroup>
					</div>

					{scope === 'line_item' && (
						<div className='space-y-1'>
							<Label className='text-sm font-medium'>{t('subscriptions.applyCouponDialog.lineItemLabel')}</Label>
							<Select value={selectedLineItemId} onValueChange={setSelectedLineItemId} disabled={!!prefilledLineItemId}>
								<SelectTrigger>
									<SelectValue placeholder={t('subscriptions.applyCouponDialog.selectLineItemPlaceholder')} />
								</SelectTrigger>
								<SelectContent>
									{lineItems.map((item) => (
										<SelectItem key={item.id} value={item.id}>
											{item.display_name || item.id}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}

					<div className='space-y-2'>
						<Label className='text-sm font-medium'>{t('subscriptions.applyCouponDialog.startDateOptional')}</Label>
						<DatePicker date={startDate} setDate={setStartDate} placeholder={t('subscriptions.applyCouponDialog.pickStartDate')} />
					</div>
					<div className='space-y-2'>
						<Label className='text-sm font-medium'>{t('subscriptions.applyCouponDialog.endDateOptional')}</Label>
						<DatePicker date={endDate} setDate={setEndDate} placeholder={t('subscriptions.applyCouponDialog.pickEndDate')} />
					</div>
				</div>

				<DialogFooter>
					<Button variant='outline' onClick={() => handleOpenChange(false)} className='flex-1'>
						{t('common:actions.cancel')}
					</Button>
					<Button onClick={handleApply} isLoading={isApplying} disabled={!couponCode.trim()} className='flex-1'>
						{t('common:actions.apply')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default ApplyCouponDialog;
