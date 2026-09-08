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
 * A segmented control rather than a Select: it is a persistent two-state mode, and both
 * options should stay visible so the switch is one click.
 */
const ThresholdUnitSelector = ({ value, labels, disabled, onChange }: ThresholdUnitSelectorProps) => (
	<div className='space-y-2'>
		<div className='flex items-center gap-1.5'>
			<span className='text-sm font-medium text-content'>{labels.unit}</span>
			<InfoIcon description={labels.unitTooltip} ariaLabel={labels.unit} disabled={disabled} />
		</div>
		<SegmentedControl
			aria-label={labels.unit}
			className='w-fit'
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
