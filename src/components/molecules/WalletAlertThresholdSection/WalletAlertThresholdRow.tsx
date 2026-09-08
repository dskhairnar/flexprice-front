import { Input } from '@/components/atoms';
import { cn } from '@/lib/utils';

/**
 * Negatives are accepted rather than blocked: post-paid wallets legitimately sit below zero, and
 * an out-of-range percentage is reported by save-time validation instead of being silently clamped.
 */
const THRESHOLD_FORMAT_OPTIONS = { allowNegative: true, allowDecimals: true, thousandSeparator: ',', decimalSeparator: '.' } as const;

export interface WalletAlertThresholdRowProps {
	/** Severity name, e.g. "Critical". */
	title: string;
	/** Fixed copy under the title, e.g. "Alert when balance falls below". */
	description: string;
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
 * One severity's threshold as a settings-list row: label and fixed condition copy on the left,
 * a single value input on the right. There is no condition picker — wallet balance alerts
 * always fire on a falling balance.
 */
const WalletAlertThresholdRow = ({
	title,
	description,
	value,
	placeholder,
	symbol,
	unit,
	disabled,
	onChange,
}: WalletAlertThresholdRowProps) => (
	<div className={cn('flex items-center justify-between gap-6 py-4', disabled && 'opacity-50')}>
		<div className='min-w-0 space-y-0.5'>
			<div className='text-sm font-medium text-content'>{title}</div>
			<div className='text-[13px] leading-relaxed text-content-secondary'>{description}</div>
		</div>
		<div className='w-[140px] shrink-0'>
			<Input
				aria-label={`${title} — ${description}`}
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
