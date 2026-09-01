import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import SettingsApi from '@/api/SettingsApi';
import { PlanApi } from '@/api/PlanApi';
import { DEFAULT_CURRENCY_CODE } from '@/constants/constants';
import { BILLING_CYCLE } from '@/models/Subscription';
import { WALLET_TYPE } from '@/models/Wallet';
import { DataType, FilterOperator } from '@/types/common/QueryBuilder';
import type { PlanResponse } from '@/types/dto';
import {
	CUSTOMER_ONBOARDING_WORKFLOW_TYPE,
	DEFAULT_CUSTOMER_ONBOARDING_CONFIG,
	normalizeCustomerOnboardingConfig,
	parseCustomerOnboardingConfig,
	type CreateSubscriptionOnboardingAction,
	type CreateWalletOnboardingAction,
	type CustomerOnboardingAction,
	type CustomerOnboardingActionSetDraft,
	type CustomerOnboardingConfig,
	type CustomerOnboardingCustomWorkflowDraft,
	type CustomerOnboardingDraft,
} from '@/types/dto/CustomerOnboarding';
import { SETTINGS_KEYS } from '../constants';
import { settingsQueryKeys } from '../queryKeys';

const COMMON_ACTIONS = new Set(['create_wallet', 'create_subscription']);
const DEFAULT_CONVERSION_RATE = '1';

function isWalletAction(action: CustomerOnboardingAction): action is CreateWalletOnboardingAction {
	return action.action === 'create_wallet';
}

function isSubscriptionAction(action: CustomerOnboardingAction): action is CreateSubscriptionOnboardingAction {
	return action.action === 'create_subscription';
}

function createCustomWorkflowId(): string {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID();
	}
	return `custom-workflow-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createEmptyActionSetDraft(): CustomerOnboardingActionSetDraft {
	return {
		walletEnabled: false,
		walletType: WALLET_TYPE.PRE_PAID,
		walletCurrency: DEFAULT_CURRENCY_CODE,
		walletConversionRate: DEFAULT_CONVERSION_RATE,
		walletInitialCreditsToLoad: '',
		walletCreditsExpireEnabled: false,
		walletCreditsExpirationDuration: '',
		walletCreditsExpirationDurationUnit: '',
		subscriptionEnabled: false,
		subscriptionPlanId: '',
		subscriptionBillingCycle: BILLING_CYCLE.ANNIVERSARY,
		subscriptionStartDate: '',
		advancedActions: [],
	};
}

export function createEmptyCustomWorkflowDraft(label = ''): CustomerOnboardingCustomWorkflowDraft {
	return {
		id: createCustomWorkflowId(),
		label,
		...createEmptyActionSetDraft(),
	};
}

export function buildActionSetDraftFromActions(actions: CustomerOnboardingAction[]): CustomerOnboardingActionSetDraft {
	const walletAction = actions.find(isWalletAction);
	const subscriptionAction = actions.find(isSubscriptionAction);
	const expirationDuration = walletAction?.initial_credits_expiration_duration;
	const expirationUnit = walletAction?.initial_credits_expiration_duration_unit || '';
	const hasExpiry = expirationDuration !== undefined || Boolean(expirationUnit);

	return {
		walletEnabled: Boolean(walletAction),
		walletType: walletAction?.wallet_type || WALLET_TYPE.PRE_PAID,
		walletCurrency: walletAction?.currency || DEFAULT_CURRENCY_CODE,
		walletConversionRate: walletAction?.conversion_rate || DEFAULT_CONVERSION_RATE,
		walletInitialCreditsToLoad: walletAction?.initial_credits_to_load?.trim() || '',
		walletCreditsExpireEnabled: hasExpiry,
		walletCreditsExpirationDuration: expirationDuration !== undefined ? String(expirationDuration) : '',
		walletCreditsExpirationDurationUnit: expirationUnit,
		subscriptionEnabled: Boolean(subscriptionAction),
		subscriptionPlanId: subscriptionAction?.plan_id || '',
		subscriptionBillingCycle: subscriptionAction?.billing_cycle || BILLING_CYCLE.ANNIVERSARY,
		subscriptionStartDate: subscriptionAction?.start_date || '',
		advancedActions: actions.filter((action) => !COMMON_ACTIONS.has(action.action)),
	};
}

export function buildActionsFromActionSetDraft(draft: CustomerOnboardingActionSetDraft): CustomerOnboardingAction[] {
	const createCustomerActions = draft.advancedActions.filter((action) => action.action === 'create_customer');
	const otherAdvancedActions = draft.advancedActions.filter((action) => action.action !== 'create_customer');
	const actions: CustomerOnboardingAction[] = [...createCustomerActions];

	if (draft.walletEnabled) {
		const creditsString = draft.walletInitialCreditsToLoad.trim();
		const durationString = draft.walletCreditsExpirationDuration.trim();
		const unit = draft.walletCreditsExpirationDurationUnit;
		const walletAction: CreateWalletOnboardingAction = {
			action: 'create_wallet',
			currency: draft.walletCurrency,
			wallet_type: draft.walletType || WALLET_TYPE.PRE_PAID,
			conversion_rate: draft.walletConversionRate,
		};

		// Include raw values when present so validation can catch incomplete/invalid cases;
		// normalizeCustomerOnboardingConfig is the final filter for the save payload.
		const creditsPositive = creditsString !== '' && Number(creditsString) > 0;
		if (creditsString !== '') {
			walletAction.initial_credits_to_load = creditsString;
		}
		// Only map expiry when credits are positive so hidden draft values don't create save traps.
		if (creditsPositive && draft.walletCreditsExpireEnabled) {
			if (durationString !== '') {
				walletAction.initial_credits_expiration_duration = Number(durationString);
			}
			if (unit) {
				walletAction.initial_credits_expiration_duration_unit = unit;
			}
		}

		actions.push(walletAction);
	}

	if (draft.subscriptionEnabled) {
		actions.push({
			action: 'create_subscription',
			plan_id: draft.subscriptionPlanId,
			billing_cycle: draft.subscriptionBillingCycle,
			...(draft.subscriptionStartDate.trim() ? { start_date: draft.subscriptionStartDate.trim() } : {}),
		});
	}

	return [...actions, ...otherAdvancedActions];
}

export function buildDraftFromConfig(config: CustomerOnboardingConfig): CustomerOnboardingDraft {
	const defaultDraft = buildActionSetDraftFromActions(config.actions);
	const customWorkflows = Object.entries(config.custom_workflows ?? {}).map(([label, actions]) => ({
		id: createCustomWorkflowId(),
		label,
		...buildActionSetDraftFromActions(actions),
	}));

	return {
		...defaultDraft,
		customWorkflows,
	};
}

export function buildConfigFromDraft(draft: CustomerOnboardingDraft): CustomerOnboardingConfig {
	return {
		workflow_type: CUSTOMER_ONBOARDING_WORKFLOW_TYPE,
		actions: buildActionsFromActionSetDraft(draft),
		custom_workflows: Object.fromEntries(
			draft.customWorkflows.map((workflow) => [workflow.label.trim(), buildActionsFromActionSetDraft(workflow)]),
		),
	};
}

async function fetchCustomerOnboardingConfig(): Promise<CustomerOnboardingConfig> {
	const setting = await SettingsApi.getSettingByKey(SETTINGS_KEYS.CUSTOMER_ONBOARDING);
	return parseCustomerOnboardingConfig(setting.value);
}

export function useCustomerOnboardingConfig() {
	const queryClient = useQueryClient();

	const query = useQuery({
		queryKey: settingsQueryKeys.customerOnboardingConfig,
		queryFn: fetchCustomerOnboardingConfig,
	});

	const updateConfiguration = useMutation({
		mutationFn: async (configuration: CustomerOnboardingConfig) => {
			const payload = normalizeCustomerOnboardingConfig(configuration);
			const setting = await SettingsApi.updateSettingByKey(SETTINGS_KEYS.CUSTOMER_ONBOARDING, { value: payload });
			return parseCustomerOnboardingConfig(setting.value);
		},
		onSuccess: (configuration) => {
			queryClient.setQueryData(settingsQueryKeys.customerOnboardingConfig, configuration);
		},
	});

	const resetToDefaults = useMutation({
		mutationFn: async () => {
			const setting = await SettingsApi.resetSettingToDefaults(SETTINGS_KEYS.CUSTOMER_ONBOARDING);
			return parseCustomerOnboardingConfig(setting.value);
		},
		onSuccess: (configuration) => {
			queryClient.setQueryData(settingsQueryKeys.customerOnboardingConfig, configuration);
		},
	});

	return {
		configuration: query.data ?? DEFAULT_CUSTOMER_ONBOARDING_CONFIG,
		isLoading: query.isLoading,
		isError: query.isError,
		refetch: query.refetch,
		updateConfiguration,
		resetToDefaults,
	};
}

async function fetchPublishedPlans(): Promise<PlanResponse[]> {
	const response = await PlanApi.getPlansByFilter({
		limit: 1000,
		offset: 0,
		filters: [
			{
				field: 'status',
				operator: FilterOperator.EQUAL,
				data_type: DataType.STRING,
				value: { string: 'published' },
			},
		],
		sort: [],
	});

	return response.items;
}

export function usePublishedPlans() {
	const query = useQuery({
		queryKey: settingsQueryKeys.customerOnboardingPlans,
		queryFn: fetchPublishedPlans,
	});

	return { plans: query.data ?? [], isLoading: query.isLoading };
}
