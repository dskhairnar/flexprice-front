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
import { useTranslation } from 'react-i18next';

interface Props {
	subscriptionId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

const ApplyTaxDialog: FC<Props> = ({ subscriptionId, open, onOpenChange, onSuccess }) => {
	const { t } = useTranslation(['billing', 'common']);
	const [taxRateId, setTaxRateId] = useState('');
	const [effectiveDate, setEffectiveDate] = useState<Date | undefined>(undefined);
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

	const handleApply = useCallback(async () => {
		setIsApplying(true);
		try {
			await SubscriptionApi.executeSubscriptionModify(subscriptionId, buildPayload());
			toast.success('Tax applied successfully');
			onSuccess();
			onOpenChange(false);
			setTaxRateId('');
			setEffectiveDate(undefined);
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Apply failed';
			toast.error(message);
		} finally {
			setIsApplying(false);
		}
	}, [subscriptionId, buildPayload, onSuccess, onOpenChange]);

	const handleOpenChange = useCallback(
		(value: boolean) => {
			if (!value) {
				setTaxRateId('');
				setEffectiveDate(undefined);
			}
			onOpenChange(value);
		},
		[onOpenChange],
	);

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className='w-full max-w-md bg-white'>
				<DialogHeader>
					<DialogTitle>{t('subscriptions.applyTaxDialog.title')}</DialogTitle>
				</DialogHeader>

				<div className='space-y-4 py-2'>
					<Select
						label={t('subscriptions.applyTaxDialog.taxRateLabel')}
						options={taxRateOptions}
						value={taxRateId}
						onChange={setTaxRateId}
						placeholder={t('subscriptions.applyTaxDialog.selectTaxRatePlaceholder')}
						required
					/>

					<div className='space-y-2'>
						<Label className='text-sm font-medium'>{t('subscriptions.applyTaxDialog.effectiveDateOptional')}</Label>
						<DatePicker date={effectiveDate} setDate={setEffectiveDate} placeholder={t('subscriptions.applyTaxDialog.pickDate')} />
					</div>
				</div>

				<DialogFooter>
					<Button variant='outline' onClick={() => handleOpenChange(false)} className='flex-1'>
						{t('common:actions.cancel')}
					</Button>
					<Button onClick={handleApply} isLoading={isApplying} disabled={!taxRateId} className='flex-1'>
						{t('common:actions.apply')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default ApplyTaxDialog;
