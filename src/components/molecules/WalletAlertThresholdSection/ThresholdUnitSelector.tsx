import { InfoIcon, SegmentedControl } from '@/components/atoms';
import type { WalletAlertThresholdType } from '@/models/Wallet';

export interface ThresholdUnitSelectorLabels {
	unit: string;
	unitTooltip: React.ReactNode;
	currency: string;
	percentage: string;
}

export interface ThresholdUnitSelectorProps {
	value: WalletAlertThresholdType;
	labels: ThresholdUnitSelectorLabels;
	disabled?: boolean;
	onChange: (value: WalletAlertThresholdType) => void;
}

/**
 * Picks whether the sibling threshold rows are read as currency amounts or percentages.
 * Label left, control right on a single line, so it reads as one more settings row rather
 * than a titled subsection. A segmented control rather than a Select: it is a persistent
 * two-state mode, and both options should stay visible so the switch is one click.
 */
const ThresholdUnitSelector = ({ value, labels, disabled, onChange }: ThresholdUnitSelectorProps) => (
	<div className='flex items-center justify-between gap-4 py-2.5'>
		<div className='flex min-w-0 items-center gap-1.5'>
			<span className='text-sm font-medium text-content'>{labels.unit}</span>
			{/* Never dimmed: the tooltip explains what the muted controls below will do once enabled. */}
			<InfoIcon description={labels.unitTooltip} ariaLabel={labels.unit} />
		</div>
		<SegmentedControl
			aria-label={labels.unit}
			className='shrink-0'
			options={[
				{ label: labels.currency, value: 'absolute' as WalletAlertThresholdType },
				{ label: labels.percentage, value: 'percentage' as WalletAlertThresholdType },
			]}
			value={value}
			onChange={onChange}
			disabled={disabled}
		/>
	</div>
);

export default ThresholdUnitSelector;
