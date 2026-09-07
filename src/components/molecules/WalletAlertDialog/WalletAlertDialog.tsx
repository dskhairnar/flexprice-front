import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Dialog, Button, SegmentedControl, Toggle, InfoIcon } from '@/components/atoms';
import toast from 'react-hot-toast';
import { WalletAlertThresholdCard } from '@/components/molecules';
import type { WalletAlertThresholdCardLabels } from '@/components/molecules/WalletAlertThresholdCard';
import { WalletAlertSettings, WalletAlertLevel, WalletAlertThresholdType } from '@/models/Wallet';
import {
	addWalletAlertThreshold,
	applyWalletAlertThresholdChange,
	fromWalletAlertDraftForSave,
	getActiveWalletAlertLevels,
	getWalletAlertValidationErrorKey,
	isWalletAlertConditionDisabled,
	setWalletAlertDraftEnabled,
	setWalletAlertDraftThresholdType,
	toWalletAlertDraft,
	toWalletAlertSettingsForValidation,
	updateWalletAlertDraftLevels,
	updateWalletAlertThreshold,
} from '@/utils/wallet/walletAlertUtils';
import { useTranslation } from 'react-i18next';

interface WalletAlertDialogProps {
	open: boolean;
	alertSettings?: WalletAlertSettings;
	onSave: (alertSettings: WalletAlertSettings) => void | Promise<void>;
	onClose: () => void;
	currency?: string;
}

const ALERT_LEVELS = [WalletAlertLevel.CRITICAL, WalletAlertLevel.WARNING, WalletAlertLevel.INFO] as const;

const WalletAlertDialog: React.FC<WalletAlertDialogProps> = ({ open, alertSettings, onSave, onClose, currency }) => {
	const { t } = useTranslation('billing');
	const [draft, setDraft] = useState(() => toWalletAlertDraft(alertSettings));
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		setDraft(toWalletAlertDraft(alertSettings));
	}, [alertSettings]);

	const activeLevels = getActiveWalletAlertLevels(draft);
	const unit = draft.alert_threshold_type === 'percentage' ? '%' : (currency ?? '');

	const getLevelLabels = (level: WalletAlertLevel): WalletAlertThresholdCardLabels => {
		const titleKey = {
			[WalletAlertLevel.CRITICAL]: 'wallet.alerts.criticalTitle',
			[WalletAlertLevel.WARNING]: 'wallet.alerts.warningTitle',
			[WalletAlertLevel.INFO]: 'wallet.alerts.infoTitle',
		} as const;
		const descriptionKey = {
			[WalletAlertLevel.CRITICAL]: 'wallet.alerts.criticalDescription',
			[WalletAlertLevel.WARNING]: 'wallet.alerts.warningDescription',
			[WalletAlertLevel.INFO]: 'wallet.alerts.infoDescription',
		} as const;

		return {
			title: t(titleKey[level]),
			description: t(descriptionKey[level]),
			add: t('wallet.alerts.add'),
			remove: t('wallet.alerts.remove'),
			thresholdValue: t('wallet.alerts.thresholdValueLabel', {
				currencySuffix: draft.alert_threshold_type === 'percentage' ? '' : currency ? ` (${currency})` : '',
			}),
			condition: t('wallet.alerts.conditionLabel'),
			conditionBelow: t('wallet.alerts.conditionBelow'),
			conditionAbove: t('wallet.alerts.conditionAbove'),
			amountPlaceholder: t('wallet.alerts.amountPlaceholder'),
		};
	};

	const handleSave = async () => {
		if (isSaving) return;

		// Validate against the raw draft so invalid values (e.g. 'abc') produce
		// the correct 'invalidXxxThreshold' error rather than 'atLeastOneThreshold'
		// (normalization would silently drop NaN values before the validator sees them).
		const validationErrorKey = getWalletAlertValidationErrorKey(toWalletAlertSettingsForValidation(draft));
		if (validationErrorKey) {
			toast.error(t(`wallet.alerts.validation.${validationErrorKey}`));
			return;
		}

		const settingsToSave = fromWalletAlertDraftForSave(draft);

		try {
			setIsSaving(true);
			await onSave(settingsToSave);
		} finally {
			setIsSaving(false);
		}
	};

	const handleClose = () => {
		if (isSaving) return;
		setDraft(toWalletAlertDraft(alertSettings));
		onClose();
	};

	return (
		<Dialog
			className='min-w-max'
			isOpen={open}
			onOpenChange={(isOpen) => {
				if (!isOpen) handleClose();
			}}
			title={t('wallet.alerts.dialogTitle')}
			showCloseButton>
			<div className='flex min-w-[600px] flex-col gap-6'>
				<Toggle
					title={t('wallet.alerts.enableTitle')}
					label={t('wallet.alerts.enableLabel')}
					description={t('wallet.alerts.enableDescription')}
					checked={draft.alert_enabled}
					onChange={(enabled) => setDraft((prev) => setWalletAlertDraftEnabled(prev, enabled))}
					disabled={isSaving}
				/>

				<div className='space-y-2'>
					<div className='flex items-center gap-1.5'>
						<span className='text-sm font-medium text-content'>{t('wallet.alerts.thresholdTypeLabel')}</span>
						<InfoIcon
							description={t('wallet.alerts.thresholdTypeTooltip')}
							ariaLabel={t('wallet.alerts.thresholdTypeLabel')}
							disabled={isSaving || !draft.alert_enabled}
						/>
					</div>
					<SegmentedControl
						aria-label={t('wallet.alerts.thresholdTypeLabel')}
						className='w-fit'
						options={[
							{ label: t('wallet.alerts.thresholdTypeAbsolute'), value: 'absolute' as WalletAlertThresholdType },
							{ label: t('wallet.alerts.thresholdTypePercentage'), value: 'percentage' as WalletAlertThresholdType },
						]}
						value={draft.alert_threshold_type}
						onChange={(type) => setDraft((prev) => setWalletAlertDraftThresholdType(prev, type))}
						disabled={isSaving || !draft.alert_enabled}
					/>
					{draft.alert_threshold_type === 'percentage' && (
						<div className='flex max-w-[560px] items-start gap-1.5 text-warning'>
							<AlertTriangle className='mt-0.5 h-3.5 w-3.5 shrink-0' />
							<p className='text-[13px] leading-relaxed'>{t('wallet.alerts.percentageWarning')}</p>
						</div>
					)}
				</div>

				<div className='space-y-4'>
					{ALERT_LEVELS.map((level) => (
						<WalletAlertThresholdCard
							key={level}
							threshold={activeLevels[level]}
							labels={getLevelLabels(level)}
							unit={unit}
							conditionDisabled={isWalletAlertConditionDisabled(level, activeLevels)}
							disabled={isSaving || !draft.alert_enabled}
							onAdd={() => setDraft((prev) => updateWalletAlertDraftLevels(prev, (levels) => addWalletAlertThreshold(levels, level)))}
							onRemove={() => setDraft((prev) => updateWalletAlertDraftLevels(prev, (levels) => updateWalletAlertThreshold(levels, level, null)))}
							onThresholdChange={(value) =>
								setDraft((prev) => updateWalletAlertDraftLevels(prev, (levels) => applyWalletAlertThresholdChange(levels, level, 'threshold', value)))
							}
							onConditionChange={(value) =>
								setDraft((prev) => updateWalletAlertDraftLevels(prev, (levels) => applyWalletAlertThresholdChange(levels, level, 'condition', value)))
							}
						/>
					))}
				</div>

				<div className='mt-6 flex justify-end gap-2'>
					<Button variant='outline' onClick={handleClose} disabled={isSaving}>
						{t('wallet.alerts.cancel')}
					</Button>
					<Button onClick={handleSave} disabled={isSaving}>
						{isSaving ? t('wallet.alerts.saving') : t('wallet.alerts.saveChanges')}
					</Button>
				</div>
			</div>
		</Dialog>
	);
};

export default WalletAlertDialog;
