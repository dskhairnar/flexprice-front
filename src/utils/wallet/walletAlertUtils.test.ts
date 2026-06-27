import { describe, expect, it } from 'vitest';
import { WalletAlertLevel } from '@/models/Wallet';
import {
	computeWalletAlertStatus,
	hasActiveWalletAlertStatus,
	hasConfiguredWalletAlertThresholds,
	isWalletAlertThresholdTriggered,
} from './walletAlertUtils';

describe('walletAlertUtils', () => {
	describe('isWalletAlertThresholdTriggered', () => {
		it('returns true when balance is below threshold', () => {
			expect(isWalletAlertThresholdTriggered(4, { threshold: '5', condition: 'below' })).toBe(true);
		});

		it('returns false when balance is above below-threshold', () => {
			expect(isWalletAlertThresholdTriggered(6, { threshold: '5', condition: 'below' })).toBe(false);
		});

		it('returns true when balance is above threshold', () => {
			expect(isWalletAlertThresholdTriggered(110, { threshold: '100', condition: 'above' })).toBe(true);
		});
	});

	describe('computeWalletAlertStatus', () => {
		const belowSettings = {
			alert_enabled: true,
			critical: { threshold: '0', condition: 'below' as const },
			warning: { threshold: '5', condition: 'below' as const },
			info: { threshold: '10', condition: 'below' as const },
		};

		it('returns null when alerts are disabled', () => {
			expect(computeWalletAlertStatus(3, { alert_enabled: false, critical: belowSettings.critical })).toBeNull();
		});

		it('returns null when no thresholds are configured', () => {
			expect(computeWalletAlertStatus(3, { alert_enabled: true })).toBeNull();
		});

		it('returns critical state for balance below critical threshold', () => {
			const result = computeWalletAlertStatus(-1, belowSettings);
			expect(result?.state).toBe('in_alarm');
			expect(result?.triggeredLevel).toBe(WalletAlertLevel.CRITICAL);
		});

		it('returns warning state for balance below warning threshold', () => {
			const result = computeWalletAlertStatus(3, belowSettings);
			expect(result?.state).toBe('warning');
			expect(result?.triggeredLevel).toBe(WalletAlertLevel.WARNING);
		});

		it('returns info state for balance below info threshold', () => {
			const result = computeWalletAlertStatus(7, belowSettings);
			expect(result?.state).toBe('info');
			expect(result?.triggeredLevel).toBe(WalletAlertLevel.INFO);
		});

		it('returns ok when balance is healthy', () => {
			const result = computeWalletAlertStatus(15, belowSettings);
			expect(result?.state).toBe('ok');
			expect(result?.triggeredLevel).toBeUndefined();
		});
	});

	describe('hasActiveWalletAlertStatus', () => {
		const belowSettings = {
			alert_enabled: true,
			warning: { threshold: '5', condition: 'below' as const },
		};

		it('returns false when balance is healthy', () => {
			expect(hasActiveWalletAlertStatus(15, belowSettings)).toBe(false);
		});

		it('returns true when an alert threshold is triggered', () => {
			expect(hasActiveWalletAlertStatus(3, belowSettings)).toBe(true);
		});
	});

	describe('hasConfiguredWalletAlertThresholds', () => {
		it('returns true when alerts are enabled with a threshold', () => {
			expect(
				hasConfiguredWalletAlertThresholds({
					alert_enabled: true,
					info: { threshold: '10', condition: 'below' },
				}),
			).toBe(true);
		});
	});
});
