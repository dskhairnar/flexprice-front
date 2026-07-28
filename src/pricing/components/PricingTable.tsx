import { FC, useMemo } from 'react';
import Select from '@/components/atoms/Select/Select';
import PricingCard from '@/components/molecules/PricingCard/PricingCard';
import { cn } from '@/lib/utils';
import type { PricingTableProps } from '../types';
import { normalizePlans } from '../schema';

/**
 * Prop-only pricing grid — no fetching, no auth, no routing. Renders the currency /
 * billing-period selectors and a responsive grid of {@link PricingCard}s. Consumers supply
 * already-filtered `plans` plus controlled selector state and callbacks.
 */
const PricingTable: FC<PricingTableProps> = ({
	plans,
	billingPeriod,
	onBillingPeriodChange,
	billingPeriodOptions,
	billingPeriodPlaceholder = 'Select billing period',
	currency,
	onCurrencyChange,
	currencyOptions,
	currencyPlaceholder = 'Select currency',
	onSelectPlan,
	getFeatureHref,
	hideFilters = false,
	onValidationError,
	className,
}) => {
	// Validate/normalize at the boundary so wrong-format SDK input degrades (bad plans dropped,
	// missing fields defaulted) instead of crashing the renderer. Idempotent for trusted data.
	const safePlans = useMemo(() => normalizePlans(plans, onValidationError), [plans, onValidationError]);

	return (
		<div className={cn('flexprice-ui', 'flex flex-col gap-6', className)}>
			{!hideFilters && (
				<div className='flex w-full justify-start gap-4'>
					<Select
						className='w-40 !rounded-xl'
						value={billingPeriod}
						options={billingPeriodOptions}
						onChange={onBillingPeriodChange}
						placeholder={billingPeriodPlaceholder}
					/>
					<Select
						className='w-40 !rounded-xl'
						value={currency}
						options={currencyOptions}
						onChange={onCurrencyChange}
						placeholder={currencyPlaceholder}
					/>
				</div>
			)}

			<div className='grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3 lg:gap-6'>
				<div className='contents'>
					{safePlans.map((plan, index) => (
						<div className='flex w-full' key={plan.id || index}>
							<PricingCard {...plan} className='w-full' useModernChrome onSelectPlan={onSelectPlan} getFeatureHref={getFeatureHref} />
						</div>
					))}
				</div>
				{/* Keep the 3-col grid balanced when fewer than 3 plans render. */}
				{safePlans.length === 2 && <div className='hidden lg:block' />}
				{safePlans.length === 1 && (
					<>
						<div className='hidden md:block' />
						<div className='hidden lg:block' />
					</>
				)}
			</div>
		</div>
	);
};

export default PricingTable;
