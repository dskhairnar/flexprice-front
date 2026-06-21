import { FC, useState, useCallback } from 'react';
import { Button, Input, DatePicker } from '@/components/atoms';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toast from 'react-hot-toast';
import SubscriptionApi from '@/api/SubscriptionApi';
import type { SubscriptionLineItemResponse, ChangedResources } from '@/types/dto/Subscription';
import { SUBSCRIPTION_MODIFY_TYPE } from '@/types/dto/Subscription';

type CouponScope = 'subscription' | 'line_item';
type Step = 'form' | 'preview';

interface Props {
	subscriptionId: string;
	lineItems: SubscriptionLineItemResponse[];
	prefilledLineItemId?: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

const ApplyCouponDialog: FC<Props> = ({ subscriptionId, lineItems, prefilledLineItemId, open, onOpenChange, onSuccess }) => {
	const [step, setStep] = useState<Step>('form');
	const [couponCode, setCouponCode] = useState('');
	const [scope, setScope] = useState<CouponScope>(prefilledLineItemId ? 'line_item' : 'subscription');
	const [selectedLineItemId, setSelectedLineItemId] = useState<string>(prefilledLineItemId ?? '');
	const [startDate, setStartDate] = useState<Date | undefined>(undefined);
	const [endDate, setEndDate] = useState<Date | undefined>(undefined);
	const [previewResult, setPreviewResult] = useState<ChangedResources | null>(null);
	const [isPreviewing, setIsPreviewing] = useState(false);
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

	const handleApply = useCallback(async () => {
		setIsApplying(true);
		try {
			await SubscriptionApi.executeSubscriptionModify(subscriptionId, buildPayload());
			toast.success('Coupon applied successfully');
			onSuccess();
			onOpenChange(false);
			// Reset state
			setStep('form');
			setCouponCode('');
			setScope(prefilledLineItemId ? 'line_item' : 'subscription');
			setSelectedLineItemId(prefilledLineItemId ?? '');
			setStartDate(undefined);
			setEndDate(undefined);
			setPreviewResult(null);
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Apply failed';
			toast.error(message);
		} finally {
			setIsApplying(false);
		}
	}, [subscriptionId, buildPayload, onSuccess, onOpenChange, prefilledLineItemId]);

	const handleBack = useCallback(() => {
		setStep('form');
		setPreviewResult(null);
	}, []);

	const handleOpenChange = useCallback(
		(value: boolean) => {
			if (!value) {
				// Reset on close
				setStep('form');
				setCouponCode('');
				setScope(prefilledLineItemId ? 'line_item' : 'subscription');
				setSelectedLineItemId(prefilledLineItemId ?? '');
				setStartDate(undefined);
				setEndDate(undefined);
				setPreviewResult(null);
			}
			onOpenChange(value);
		},
		[onOpenChange, prefilledLineItemId],
	);

	const hasInvoices = Array.isArray(previewResult?.invoices) && previewResult.invoices.length > 0;
	const hasLineItems = Array.isArray(previewResult?.line_items) && previewResult.line_items.length > 0;
	const hasNoBillingImpact = previewResult !== null && !hasInvoices && !hasLineItems;

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className='w-full max-w-md bg-white'>
				<DialogHeader>
					<DialogTitle>Apply Coupon</DialogTitle>
				</DialogHeader>

				{step === 'form' && (
					<div className='space-y-4 py-2'>
						{/* Coupon Code Input */}
						<Input
							id='coupon-code'
							label='Coupon Code'
							placeholder='e.g. SUMMER20'
							value={couponCode}
							onChange={(value: string) => setCouponCode(value)}
							required
						/>

						{/* Scope selector */}
						<div className='space-y-2'>
							<Label className='text-sm font-medium'>Apply To</Label>
							<RadioGroup value={scope} onValueChange={(value) => setScope(value as CouponScope)} disabled={!!prefilledLineItemId}>
								<div className='flex items-center space-x-2'>
									<RadioGroupItem value='subscription' id='scope-subscription' disabled={!!prefilledLineItemId} />
									<Label htmlFor='scope-subscription' className='font-normal cursor-pointer'>
										Subscription level
									</Label>
								</div>
								<div className='flex items-center space-x-2'>
									<RadioGroupItem value='line_item' id='scope-line-item' disabled={!!prefilledLineItemId} />
									<Label htmlFor='scope-line-item' className='font-normal cursor-pointer'>
										Line item level
									</Label>
								</div>
							</RadioGroup>
						</div>

						{/* Line item selector (only shown when scope is line_item) */}
						{scope === 'line_item' && (
							<div className='space-y-1'>
								<Label className='text-sm font-medium'>Line Item</Label>
								<Select value={selectedLineItemId} onValueChange={setSelectedLineItemId} disabled={!!prefilledLineItemId}>
									<SelectTrigger>
										<SelectValue placeholder='Select a line item' />
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

						{/* Date fields */}
						<div className='space-y-2'>
							<Label className='text-sm font-medium'>Start Date (optional)</Label>
							<DatePicker date={startDate} setDate={setStartDate} placeholder='Pick a start date' />
						</div>
						<div className='space-y-2'>
							<Label className='text-sm font-medium'>End Date (optional)</Label>
							<DatePicker date={endDate} setDate={setEndDate} placeholder='Pick an end date' />
						</div>
					</div>
				)}

				{step === 'preview' && (
					<div className='space-y-4 py-2'>
						<p className='text-sm font-medium text-zinc-700'>Preview</p>
						{hasNoBillingImpact && <p className='text-sm text-muted-foreground'>No billing impact</p>}
						{hasInvoices && (
							<div className='space-y-1'>
								<p className='text-xs font-medium text-zinc-500 uppercase tracking-wide'>Invoices affected</p>
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
								<p className='text-xs font-medium text-zinc-500 uppercase tracking-wide'>Line items affected</p>
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
					{step === 'form' && (
						<>
							<Button variant='outline' onClick={() => handleOpenChange(false)} className='flex-1'>
								Cancel
							</Button>
							<Button onClick={handlePreview} isLoading={isPreviewing} disabled={!couponCode.trim()} className='flex-1'>
								Preview
							</Button>
						</>
					)}
					{step === 'preview' && (
						<>
							<Button variant='outline' onClick={handleBack} className='flex-1'>
								Back
							</Button>
							<Button onClick={handleApply} isLoading={isApplying} className='flex-1'>
								Apply
							</Button>
						</>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default ApplyCouponDialog;
