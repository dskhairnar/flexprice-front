import { WalletAlertLevel, WalletAlertSettings, WalletAlertState, WalletAlertThreshold } from '@/models/Wallet';

export interface WalletAlertStatusResult {
	state: WalletAlertState;
	triggeredLevel?: WalletAlertLevel;
	triggeredThreshold?: WalletAlertThreshold;
}

const ALERT_LEVEL_CHECKS: Array<{ level: WalletAlertLevel; state: WalletAlertState }> = [
	{ level: WalletAlertLevel.CRITICAL, state: 'in_alarm' },
	{ level: WalletAlertLevel.WARNING, state: 'warning' },
	{ level: WalletAlertLevel.INFO, state: 'info' },
];

export function hasConfiguredWalletAlertThresholds(settings?: WalletAlertSettings | null): boolean {
	if (!settings?.alert_enabled) return false;
	return Boolean(settings.critical || settings.warning || settings.info);
}

export function isWalletAlertThresholdTriggered(balance: number, threshold: WalletAlertThreshold): boolean {
	const value = parseFloat(threshold.threshold);
	if (Number.isNaN(value)) return false;
	return threshold.condition === 'below' ? balance < value : balance > value;
}

export function computeWalletAlertStatus(balance: number, settings?: WalletAlertSettings | null): WalletAlertStatusResult | null {
	if (!hasConfiguredWalletAlertThresholds(settings)) return null;

	for (const { level, state } of ALERT_LEVEL_CHECKS) {
		const threshold = settings?.[level];
		if (threshold && isWalletAlertThresholdTriggered(balance, threshold)) {
			return { state, triggeredLevel: level, triggeredThreshold: threshold };
		}
	}

	return { state: 'ok' };
}

export function hasActiveWalletAlertStatus(balance: number, settings?: WalletAlertSettings | null): boolean {
	const status = computeWalletAlertStatus(balance, settings);
	return status !== null && status.state !== 'ok';
}
