import { describe, expect, it } from 'vitest';
import { BILLING_CYCLE } from '@/models/Subscription';
import { WALLET_TYPE } from '@/models/Wallet';
import { CUSTOMER_ONBOARDING_WORKFLOW_TYPE } from '@/types/dto/CustomerOnboarding';
import { buildConfigFromDraft, buildDraftFromConfig, createEmptyCustomWorkflowDraft } from './useCustomerOnboardingConfig';

describe('customer onboarding draft builders', () => {
	it('round-trips custom_workflows through draft and config', () => {
		const config = {
			workflow_type: CUSTOMER_ONBOARDING_WORKFLOW_TYPE,
			actions: [{ action: 'create_wallet' as const, currency: 'USD', wallet_type: WALLET_TYPE.PRE_PAID }],
			custom_workflows: {
				enterprise_trial: [{ action: 'create_subscription' as const, plan_id: 'plan_1', billing_cycle: BILLING_CYCLE.ANNIVERSARY }],
				empty_set: [],
			},
		};

		const draft = buildDraftFromConfig(config);
		expect(draft.walletEnabled).toBe(true);
		expect(draft.customWorkflows).toHaveLength(2);
		expect(draft.customWorkflows.map((workflow) => workflow.label).sort()).toEqual(['empty_set', 'enterprise_trial']);

		const enterprise = draft.customWorkflows.find((workflow) => workflow.label === 'enterprise_trial');
		expect(enterprise?.subscriptionEnabled).toBe(true);
		expect(enterprise?.subscriptionPlanId).toBe('plan_1');

		const rebuilt = buildConfigFromDraft(draft);
		expect(rebuilt.actions).toEqual([
			{ action: 'create_wallet', currency: 'USD', wallet_type: WALLET_TYPE.PRE_PAID, conversion_rate: '1' },
		]);
		expect(rebuilt.custom_workflows).toEqual({
			enterprise_trial: [{ action: 'create_subscription', plan_id: 'plan_1', billing_cycle: BILLING_CYCLE.ANNIVERSARY }],
			empty_set: [],
		});
	});

	it('omits custom_workflows from config when no custom workflows exist', () => {
		const draft = buildDraftFromConfig({
			workflow_type: CUSTOMER_ONBOARDING_WORKFLOW_TYPE,
			actions: [],
		});
		expect(buildConfigFromDraft(draft).custom_workflows).toBeUndefined();
	});

	it('includes a newly added empty custom workflow under its trimmed name', () => {
		const draft = buildDraftFromConfig({
			workflow_type: CUSTOMER_ONBOARDING_WORKFLOW_TYPE,
			actions: [],
		});
		draft.customWorkflows = [createEmptyCustomWorkflowDraft('  trial_a  ')];

		expect(buildConfigFromDraft(draft).custom_workflows).toEqual({
			trial_a: [],
		});
	});
});
