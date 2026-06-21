import { FC, useState, useCallback } from 'react';
import { Button, DatePicker, Select } from '@/components/atoms';
import type { SelectOption } from '@/components/atoms';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import SubscriptionApi from '@/api/SubscriptionApi';
import TaxApi from '@/api/TaxApi';
import { SUBSCRIPTION_MODIFY_TYPE, SUB_MODIFY_TAX_ACTION } from '@/models';
import type { ChangedResources } from '@/types/dto/Subscription';

type Step = 'form' | 'preview';

interface Props {
	subscriptionId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

const ApplyTaxDialog: FC<Props> = ({ subscriptionId, open, onOpenChange, onSuccess }) => {
	const [step, setStep] = useState<Step>('form');
	const [taxRateId, setTaxRateId] = useState('');
	const [effectiveDate, setEffectiveDate] = useState<Date | undefined>(undefined);
	const [previewResult, setPreviewResult] = useState<ChangedResources | null>(null);
	const [isPreviewing, setIsPreviewing] = useState(false);
	const [isApplying, setIsApplying] = useState(false);

	const { data: taxRatesData } = useQuery({
		queryKey: ['tax-rates', 'list'],
		queryFn: () => TaxApi.listTaxRates({ limit: 100, offset: 0 }),
		enabled: open,
	});

	const taxRateOptions: SelectOption[] = (taxRatesData?.items ?? []).map((rate) => ({
		value: rate.id,
		label: `${rate.name} (${rate.code})`,
	}));

	const buildPayload = useCallback(() => {
		return {
			type: SUBSCRIPTION_MODIFY_TYPE.TAX,
			tax_params: {
				action: SUB_MODIFY_TAX_ACTION.ADD,
				tax_rate_id: taxRateId,
				...(effectiveDate ? { effective_date: effectiveDate.toISOString() } : {}),
			},
		};
	}, [taxRateId, effectiveDate]);

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
			toast.success('Tax applied successfully');
			onSuccess();
			onOpenChange(false);
			setStep('form');
			setTaxRateId('');
			setEffectiveDate(undefined);
			setPreviewResult(null);
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Apply failed';
			toast.error(message);
		} finally {
			setIsApplying(false);
		}
	}, [subscriptionId, buildPayload, onSuccess, onOpenChange]);

	const handleBack = useCallback(() => {
		setStep('form');
		setPreviewResult(null);
	}, []);

	const handleOpenChange = useCallback(
		(value: boolean) => {
			if (!value) {
				setStep('form');
				setTaxRateId('');
				setEffectiveDate(undefined);
				setPreviewResult(null);
			}
			onOpenChange(value);
		},
		[onOpenChange],
	);

	const hasInvoices = Array.isArray(previewResult?.invoices) && previewResult.invoices.length > 0;
	const hasLineItems = Array.isArray(previewResult?.line_items) && previewResult.line_items.length > 0;
	const hasNoBillingImpact = previewResult !== null && !hasInvoices && !hasLineItems;

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className='w-full max-w-md bg-white'>
				<DialogHeader>
					<DialogTitle>Apply Tax</DialogTitle>
				</DialogHeader>

				{step === 'form' && (
					<div className='space-y-4 py-2'>
						<Select
							label='Tax Rate'
							options={taxRateOptions}
							value={taxRateId}
							onChange={setTaxRateId}
							placeholder='Select a tax rate'
							required
						/>

						<div className='space-y-2'>
							<Label className='text-sm font-medium'>Effective Date (optional)</Label>
							<DatePicker date={effectiveDate} setDate={setEffectiveDate} placeholder='Pick a date' />
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
							<Button onClick={handlePreview} isLoading={isPreviewing} disabled={!taxRateId} className='flex-1'>
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

export default ApplyTaxDialog;
