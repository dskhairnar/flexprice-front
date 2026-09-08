import { WalletAlertLevel, type WalletAlertDraft, type WalletAlertThresholdType } from '@/models/Wallet';
import {
	getActiveWalletAlertLevels,
	setWalletAlertDraftThresholdType,
	setWalletAlertThresholdValue,
	updateWalletAlertDraftLevels,
} from '@/utils/wallet/walletAlertUtils';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import ThresholdUnitSelector from './ThresholdUnitSelector';
import WalletAlertThresholdRow from './WalletAlertThresholdRow';

const ALERT_LEVELS = [WalletAlertLevel.CRITICAL, WalletAlertLevel.WARNING, WalletAlertLevel.INFO] as const;

export interface WalletAlertThresholdSectionLabels {
	unit: string;
	unitTooltip: React.ReactNode;
	unitCurrency: string;
	unitPercentage: string;
	/** Fixed condition copy on every row, e.g. "Falls below". */
	rowDescription: string;
	amountPlaceholder: string;
	levels: Record<WalletAlertLevel, string>;
}

export interface WalletAlertThresholdSectionProps {
	draft: WalletAlertDraft;
	labels: WalletAlertThresholdSectionLabels;
	disabled?: boolean;
	/** Wallet currency, when the thresholds belong to one specific wallet. Omitted for tenant-wide defaults, which span currencies. */
	currency?: string;
	onChange: (draft: WalletAlertDraft) => void;
}

/**
 * The whole thresholds block — unit selector plus one row per severity — so the wallet dialog
 * and the tenant settings page present an identical control surface and differ only in the copy
 * they pass in.
 */
const WalletAlertThresholdSection = ({ draft, labels, disabled, currency, onChange }: WalletAlertThresholdSectionProps) => {
	const levels = getActiveWalletAlertLevels(draft);
	const isPercentage = draft.alert_threshold_type === 'percentage';
	const symbol = !isPercentage && currency ? getCurrencySymbol(currency) : undefined;

	const handleUnitChange = (type: WalletAlertThresholdType) => onChange(setWalletAlertDraftThresholdType(draft, type));

	const handleThresholdChange = (level: WalletAlertLevel, value: string) =>
		onChange(updateWalletAlertDraftLevels(draft, (current) => setWalletAlertThresholdValue(current, level, value)));

	return (
		<div>
			<ThresholdUnitSelector
				value={draft.alert_threshold_type}
				labels={{
					unit: labels.unit,
					unitTooltip: labels.unitTooltip,
					currency: labels.unitCurrency,
					percentage: labels.unitPercentage,
				}}
				disabled={disabled}
				onChange={handleUnitChange}
			/>

			<div className='divide-y divide-line'>
				{ALERT_LEVELS.map((level) => (
					<WalletAlertThresholdRow
						key={level}
						title={labels.levels[level]}
						description={labels.rowDescription}
						value={levels[level]?.threshold ?? ''}
						placeholder={labels.amountPlaceholder}
						symbol={symbol}
						unit={isPercentage ? '%' : undefined}
						disabled={disabled}
						onChange={(value) => handleThresholdChange(level, value)}
					/>
				))}
			</div>
		</div>
	);
};

export default WalletAlertThresholdSection;
