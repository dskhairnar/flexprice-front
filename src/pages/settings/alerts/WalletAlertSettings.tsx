import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Button, Card, InfoIcon, Loader, SegmentedControl, Tooltip } from '@/components/atoms';
import { SettingsCardHeader, WalletAlertThresholdCard } from '@/components/molecules';
import type { WalletAlertThresholdCardLabels } from '@/components/molecules/WalletAlertThresholdCard';
import { Switch } from '@/components/ui/switch';
import { WalletAlertLevel, WalletAlertThresholdType } from '@/models/Wallet';
import {
	addWalletAlertThreshold,
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
import { useWalletAlertSettings } from './useWalletAlertSettings';
import { useCurrentUserPermissions } from '@/hooks/useCurrentUserPermissions';

const ALERT_LEVELS = [WalletAlertLevel.CRITICAL, WalletAlertLevel.WARNING, WalletAlertLevel.INFO] as const;

const WalletAlertSettingsSection = () => {
	const { t } = useTranslation(['settings', 'common']);
	const { settings, isLoading, updateSettings } = useWalletAlertSettings();
	const { can, isSuperAdmin } = useCurrentUserPermissions();
	// Backed by SettingsApi (a generic settings key), whose PUT the backend restricts to Super
	// Admin regardless of alert_settings:write — see SamlSsoTab's own settings-gating note.
	const canWriteAlertSettings = can('alert_settings', 'write') && isSuperAdmin;
	const [draft, setDraft] = useState(() => toWalletAlertDraft(settings));

	useEffect(() => {
		setDraft(toWalletAlertDraft(settings));
	}, [settings]);

	const activeLevels = getActiveWalletAlertLevels(draft);
	const unit = draft.alert_threshold_type === 'percentage' ? '%' : '';

	const getLevelLabels = (level: WalletAlertLevel): WalletAlertThresholdCardLabels => ({
		title: t(`alerts.walletAlerts.levels.${level}`),
		description: t(`alerts.walletAlerts.levelDescriptions.${level}`),
		add: t('alerts.walletAlerts.add'),
		remove: t('alerts.walletAlerts.remove'),
		thresholdValue: t('alerts.walletAlerts.thresholdValue'),
		condition: t('alerts.walletAlerts.condition'),
		conditionBelow: t('alerts.walletAlerts.conditions.below'),
		conditionAbove: t('alerts.walletAlerts.conditions.above'),
		amountPlaceholder: t('alerts.walletAlerts.amountPlaceholder'),
	});

	const handleSave = () => {
		// Validate against the raw draft so invalid values (e.g. 'abc') produce the correct
		// 'invalidXxxThreshold' error rather than 'atLeastOneThreshold' — normalization would
		// silently drop NaN values before the validator sees them.
		const validationErrorKey = getWalletAlertValidationErrorKey(toWalletAlertSettingsForValidation(draft));

		if (validationErrorKey) {
			toast.error(t(`alerts.walletAlerts.validation.${validationErrorKey}`));
			return;
		}

		const normalized = fromWalletAlertDraftForSave(draft);

		updateSettings.mutate(normalized, {
			onSuccess: () => toast.success(t('alerts.walletAlerts.saveSuccess')),
			onError: () => toast.error(t('alerts.walletAlerts.saveError')),
		});
	};

	const isDisabled = !draft.alert_enabled || updateSettings.isPending;
	const alertsTitle = t('alerts.walletAlerts.title');

	return (
		<Card variant='default' noPadding className='rounded-xl border-line bg-surface shadow-sm'>
			<div className='px-6 pt-6'>
				<SettingsCardHeader
					title={alertsTitle}
					infoDescription={t('alerts.walletAlerts.description')}
					infoAriaLabel={t('info.ariaLabel', { field: alertsTitle })}
					titleClassName='text-lg font-medium text-content-zinc-strong'
					className='mb-2'
					cta={
						<Switch
							checked={draft.alert_enabled}
							onCheckedChange={(enabled) => setDraft((prev) => setWalletAlertDraftEnabled(prev, enabled))}
							disabled={isLoading || updateSettings.isPending}
							aria-label={alertsTitle}
						/>
					}
				/>
			</div>
			{isLoading ? (
				<div className='flex min-h-[200px] items-center justify-center'>
					<Loader />
				</div>
			) : (
				<div className='space-y-6 px-6 pb-6 pt-6'>
					<div className='space-y-2'>
						<div className='flex items-center gap-1.5'>
							<span className='text-sm font-medium text-content'>{t('alerts.walletAlerts.thresholdTypeLabel')}</span>
							<InfoIcon
								description={t('alerts.walletAlerts.thresholdTypeTooltip')}
								ariaLabel={t('alerts.walletAlerts.thresholdTypeLabel')}
								disabled={isDisabled}
							/>
						</div>
						<SegmentedControl
							aria-label={t('alerts.walletAlerts.thresholdTypeLabel')}
							className='w-fit'
							options={[
								{ label: t('alerts.walletAlerts.thresholdTypeAbsolute'), value: 'absolute' as WalletAlertThresholdType },
								{ label: t('alerts.walletAlerts.thresholdTypePercentage'), value: 'percentage' as WalletAlertThresholdType },
							]}
							value={draft.alert_threshold_type}
							onChange={(type) => setDraft((prev) => setWalletAlertDraftThresholdType(prev, type))}
							disabled={isDisabled}
						/>
						{draft.alert_threshold_type === 'percentage' && (
							<div className='flex max-w-[560px] items-start gap-1.5 text-warning'>
								<AlertTriangle className='mt-0.5 h-3.5 w-3.5 shrink-0' />
								<p className='text-[13px] leading-relaxed'>{t('alerts.walletAlerts.percentageWarning')}</p>
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
								disabled={isDisabled}
								onAdd={() => setDraft((prev) => updateWalletAlertDraftLevels(prev, (levels) => addWalletAlertThreshold(levels, level)))}
								onRemove={() =>
									setDraft((prev) => updateWalletAlertDraftLevels(prev, (levels) => updateWalletAlertThreshold(levels, level, null)))
								}
								onThresholdChange={(value) =>
									setDraft((prev) => updateWalletAlertDraftLevels(prev, (levels) => updateWalletAlertThreshold(levels, level, { threshold: value })))
								}
								onConditionChange={(value) =>
									setDraft((prev) => updateWalletAlertDraftLevels(prev, (levels) => updateWalletAlertThreshold(levels, level, { condition: value })))
								}
							/>
						))}
					</div>
					<div className='flex justify-end'>
						{canWriteAlertSettings ? (
							<Button onClick={handleSave} isLoading={updateSettings.isPending} disabled={updateSettings.isPending}>
								{t('alerts.walletAlerts.saveChanges')}
							</Button>
						) : (
							<Tooltip content={t('superAdmin.writeDeniedTooltip')}>
								<span tabIndex={0} className='inline-block'>
									<Button disabled>{t('alerts.walletAlerts.saveChanges')}</Button>
								</span>
							</Tooltip>
						)}
					</div>
				</div>
			)}
		</Card>
	);
};

export default WalletAlertSettingsSection;
