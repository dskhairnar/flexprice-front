import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { AlertCircle } from 'lucide-react';
import CustomerPortalApi from '@/api/CustomerPortalApi';
import { Button, Input, Select } from '@/components/atoms';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import type { DurationUnit } from '@/models/Wallet';
import type { PortalAutoTopupRequest } from '@/types/dto/CustomerPortalBilling';
import { WalletResponse } from '@/types/dto/Wallet';

interface AutoTopUpFormProps {
	wallet: WalletResponse;
	/** True when a saved method can be charged unattended. */
	hasChargeableMethod: boolean;
	onAddPaymentMethod?: () => void;
	onDone?: () => void;
}

const DURATION_UNITS: DurationUnit[] = ['second', 'minute', 'hour', 'day'];

/**
 * Auto top-up configuration.
 *
 * The payload is flat and narrower than the admin one. There is no invoicing
 * toggle — that selects the transaction reason and is the tenant's call — and no
 * auto-charge switch: enabling auto top-up *is* the consent to be charged
 * unattended, so a second checkbox would only imply a choice that is not offered.
 *
 * Because of that, auto top-up needs a chargeable saved method to be meaningful,
 * and says so rather than saving a config that can never fire.
 */
const AutoTopUpForm = ({ wallet, hasChargeableMethod, onAddPaymentMethod, onDone }: AutoTopUpFormProps) => {
	const { t } = useTranslation('customer-portal');

	const [enabled, setEnabled] = useState(wallet.auto_topup?.enabled ?? false);
	const [threshold, setThreshold] = useState(wallet.auto_topup?.threshold ?? '');
	const [amount, setAmount] = useState(wallet.auto_topup?.amount ?? '');
	const [cooldownValue, setCooldownValue] = useState(wallet.auto_topup?.cooldown?.value ? String(wallet.auto_topup.cooldown.value) : '');
	const [cooldownUnit, setCooldownUnit] = useState<DurationUnit>(wallet.auto_topup?.cooldown?.unit ?? 'hour');

	const { mutate: save, isPending } = useMutation({
		mutationFn: () => {
			const payload: PortalAutoTopupRequest = {
				enabled,
				...(enabled ? { threshold, amount } : {}),
				// null clears a stored cooloff; omitting the field would leave it in place.
				cooldown: cooldownValue && Number(cooldownValue) > 0 ? { value: Number(cooldownValue), unit: cooldownUnit } : null,
			};
			return CustomerPortalApi.updateAutoTopup(wallet.id, payload);
		},
		onSuccess: async () => {
			toast.success(t('autoTopUp.saved'));
			onDone?.();
			await refetchQueries(['portal-wallets', 'portal-wallet-balance']);
		},
		onError: (error: Error) => toast.error(error.message || t('errors.saveAutoTopUp')),
	});

	// Both are required by the API whenever auto top-up is on.
	const isValid = !enabled || (Number(threshold) > 0 && Number(amount) > 0);
	const currencySymbol = getCurrencySymbol(wallet.currency ?? 'USD');

	return (
		<div className='space-y-4'>
			<div className='flex items-start gap-2'>
				<Checkbox
					id='portal-auto-topup-enabled'
					checked={enabled}
					onCheckedChange={(checked) => setEnabled(checked === true)}
					disabled={isPending}
				/>
				<Label htmlFor='portal-auto-topup-enabled' className='text-sm font-normal leading-snug'>
					{t('autoTopUp.enableLabel')}
				</Label>
			</div>

			{enabled && !hasChargeableMethod && (
				<div
					className='flex items-start gap-2 rounded-lg border p-3'
					style={{ borderColor: 'var(--portal-border, #E9E9E9)', backgroundColor: 'var(--portal-bg, #fafafa)' }}>
					<AlertCircle className='h-4 w-4 mt-0.5 shrink-0' style={{ color: 'rgb(var(--fp-danger))' }} />
					<div className='text-sm'>
						<p style={{ color: 'var(--portal-text-primary, #09090b)' }}>{t('autoTopUp.noSavedCard')}</p>
						{onAddPaymentMethod && (
							<button
								type='button'
								onClick={onAddPaymentMethod}
								className='underline mt-0.5'
								style={{ color: 'var(--portal-primary, #2563eb)' }}>
								{t('paymentMethods.add')}
							</button>
						)}
					</div>
				</div>
			)}

			{enabled && (
				<>
					<div className='grid gap-4 sm:grid-cols-2'>
						<Input
							label={t('autoTopUp.thresholdLabel')}
							description={t('autoTopUp.thresholdHelp')}
							type='number'
							value={threshold}
							onChange={setThreshold}
							disabled={isPending}
							inputPrefix={currencySymbol}
						/>
						<Input
							label={t('autoTopUp.amountLabel')}
							description={t('autoTopUp.amountHelp')}
							type='number'
							value={amount}
							onChange={setAmount}
							disabled={isPending}
							inputPrefix={currencySymbol}
						/>
					</div>

					<div className='grid gap-4 sm:grid-cols-2'>
						<Input
							label={t('autoTopUp.cooloffLabel')}
							description={t('autoTopUp.cooloffHelp')}
							type='number'
							value={cooldownValue}
							onChange={setCooldownValue}
							disabled={isPending}
							placeholder={t('autoTopUp.cooloffPlaceholder')}
						/>
						<Select
							label={t('autoTopUp.cooloffUnitLabel')}
							value={cooldownUnit}
							onChange={(value) => setCooldownUnit(value as DurationUnit)}
							options={DURATION_UNITS.map((unit) => ({ value: unit, label: t(`autoTopUp.cooloffUnits.${unit}`) }))}
							disabled={isPending || !cooldownValue}
						/>
					</div>
				</>
			)}

			<Button onClick={() => save()} disabled={!isValid || isPending} isLoading={isPending}>
				{t('autoTopUp.save')}
			</Button>
		</div>
	);
};

export default AutoTopUpForm;
