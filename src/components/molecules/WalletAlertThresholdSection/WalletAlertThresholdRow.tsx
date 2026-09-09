import { Input, Select } from '@/components/atoms';
import type { WalletAlertCondition } from '@/utils/wallet/walletAlertUtils';

/**
 * Negatives are accepted rather than blocked: post-paid wallets legitimately sit below zero, and
 * an out-of-range percentage is reported by save-time validation instead of being silently clamped.
 */
const THRESHOLD_FORMAT_OPTIONS = { allowNegative: true, allowDecimals: true, thousandSeparator: ',', decimalSeparator: '.' } as const;

export interface WalletAlertThresholdRowProps {
	/** Severity name, e.g. "Critical". */
	title: string;
	/** Currently selected comparison. Wallet balance alerts are always 'below'. */
	condition: WalletAlertCondition;
	conditionLabels: { below: string; above: string };
	/**
	 * Locks the condition picker. It stays visible so the comparison is explicit, but wallet
	 * balance alerts only ever fire on a falling balance, so there is nothing to choose.
	 */
	conditionDisabled?: boolean;
	onConditionChange?: (condition: WalletAlertCondition) => void;
	/** Empty string means this severity has no threshold configured. */
	value: string;
	placeholder: string;
	/** Currency symbol shown before the value; omitted in percentage mode and where no currency applies. */
	symbol?: string;
	/** Unit shown after the value, e.g. '%'. Purely visual — never part of the stored value. */
	unit?: string;
	disabled?: boolean;
	onChange: (value: string) => void;
}

/**
 * One severity as a single horizontal row: fixed-width severity column, the comparison, then the
 * value input. The severity, condition and input columns are fixed so the three rows line up as
 * one block.
 */
const WalletAlertThresholdRow = ({
	title,
	condition,
	conditionLabels,
	conditionDisabled,
	onConditionChange,
	value,
	placeholder,
	symbol,
	unit,
	disabled,
	onChange,
}: WalletAlertThresholdRowProps) => (
	<div className='flex items-center gap-4 py-2'>
		<span className='w-24 shrink-0 text-sm font-medium text-content'>{title}</span>
		<div className='w-[150px] shrink-0'>
			<Select
				ariaLabel={`${title} condition`}
				options={[
					{ label: conditionLabels.below, value: 'below' },
					{ label: conditionLabels.above, value: 'above' },
				]}
				value={condition}
				onChange={(next) => onConditionChange?.(next as WalletAlertCondition)}
				disabled={disabled || conditionDisabled}
			/>
		</div>
		<div className='flex-1' />
		<div className='w-[132px] shrink-0'>
			<Input
				aria-label={`${title} threshold`}
				placeholder={placeholder}
				value={value}
				onChange={onChange}
				variant='number'
				formatOptions={THRESHOLD_FORMAT_OPTIONS}
				inputMode='decimal'
				disabled={disabled}
				inputPrefix={symbol ? <span className='text-sm text-content-secondary'>{symbol}</span> : undefined}
				suffix={unit}
			/>
		</div>
	</div>
);

export default WalletAlertThresholdRow;
