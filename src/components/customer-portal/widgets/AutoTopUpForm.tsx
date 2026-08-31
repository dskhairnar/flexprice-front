import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
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
import { WalletResponse } from '@/types/dto/Wallet';
import { portalPaymentMethodsQueryKey } from '../queryKeys';

interface AutoTopUpFormProps {
	wallet: WalletResponse;
	onDone?: () => void;
}

/** Sending value 0 clears a stored cooloff; omitting the field would leave it in place. */
const CLEARED_COOLDOWN = { value: 0, unit: 'second' as const };

const DURATION_UNITS: DurationUnit[] = ['second', 'minute', 'hour', 'day'];

/**
 * Auto top-up configuration for the customer portal.
 *
 * Auto-charging a saved card is only meaningful when one exists, so the option is
 * disabled with a route to add one when the customer has none.
 */
const AutoTopUpForm = ({ wallet, onDone }: AutoTopUpFormProps) => {
	const { t } = useTranslation('customer-portal');

	const [enabled, setEnabled] = useState(wallet.auto_topup?.enabled ?? false);
	const [threshold, setThreshold] = useState(wallet.auto_topup?.threshold ?? '');
	const [amount, setAmount] = useState(wallet.auto_topup?.amount ?? '');
	const [cooldownValue, setCooldownValue] = useState(wallet.auto_topup?.cooldown?.value ? String(wallet.auto_topup.cooldown.value) : '');
	const [cooldownUnit, setCooldownUnit] = useState<DurationUnit>(wallet.auto_topup?.cooldown?.unit ?? 'hour');
	// invoicing=false means the auto top-up is charged rather than billed later.
	const [autoCharge, setAutoCharge] = useState(wallet.auto_topup?.invoicing === false);

	const { data: paymentMethods } = useQuery({
		queryKey: portalPaymentMethodsQueryKey,
		queryFn: () => CustomerPortalApi.getPaymentMethods({ provider: 'stripe' }),
	});
	const hasSavedCard = (paymentMethods?.stripe ?? []).length > 0;

	const { mutate: save, isPending } = useMutation({
		mutationFn: () =>
			CustomerPortalApi.updateAutoTopup(wallet.id, {
				auto_topup: {
					enabled,
					threshold,
					amount,
					invoicing: !autoCharge,
					cooldown: cooldownValue && Number(cooldownValue) > 0 ? { value: Number(cooldownValue), unit: cooldownUnit } : CLEARED_COOLDOWN,
				},
			}),
		onSuccess: async () => {
			toast.success(t('autoTopUp.saved'));
			onDone?.();
			await refetchQueries(['portal-wallets', 'portal-wallet-balance']);
		},
		onError: () => toast.error(t('errors.saveAutoTopUp')),
	});

	const { mutate: addPaymentMethod, isPending: isAddingCard } = useMutation({
		mutationFn: () =>
			CustomerPortalApi.addPaymentMethod({ provider: 'stripe', success_url: window.location.href, cancel_url: window.location.href }),
		onSuccess: (response) => {
			if (!response.checkout_url) {
				toast.error(t('errors.addPaymentMethod'));
				return;
			}
			window.location.href = response.checkout_url;
		},
		onError: () => toast.error(t('errors.addPaymentMethod')),
	});

	const currencySymbol = getCurrencySymbol(wallet.currency ?? 'USD');
	// Both values are required by the API whenever auto top-up is on.
	const isValid = !enabled || (Number(threshold) > 0 && Number(amount) > 0);

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
							disabled={isPending}
						/>
					</div>

					<div>
						<div className='flex items-start gap-2'>
							<Checkbox
								id='portal-auto-topup-charge'
								checked={autoCharge}
								onCheckedChange={(checked) => setAutoCharge(checked === true)}
								disabled={isPending || !hasSavedCard}
							/>
							<Label htmlFor='portal-auto-topup-charge' className='text-sm font-normal leading-snug'>
								{t('autoTopUp.autoChargeLabel')}
							</Label>
						</div>
						{!hasSavedCard && (
							<div className='flex items-center gap-2 mt-2 ps-6'>
								<AlertCircle className='h-3.5 w-3.5 shrink-0' style={{ color: 'var(--portal-text-secondary, #71717a)' }} />
								<span className='text-xs' style={{ color: 'var(--portal-text-secondary, #71717a)' }}>
									{t('autoTopUp.noSavedCard')}
								</span>
								<Button variant='link' size='xs' onClick={() => addPaymentMethod()} isLoading={isAddingCard}>
									{t('paymentMethods.add')}
								</Button>
							</div>
						)}
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
