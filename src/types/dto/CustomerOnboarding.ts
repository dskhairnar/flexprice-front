import { z } from 'zod';
import { CREDIT_GRANT_PERIOD_UNIT } from '@/models/CreditGrant';
import { BILLING_CYCLE } from '@/models/Subscription';
import { WALLET_TYPE } from '@/models/Wallet';

export const CUSTOMER_ONBOARDING_WORKFLOW_TYPE = 'customer_onboarding' as const;

export type CustomerOnboardingWorkflowType = typeof CUSTOMER_ONBOARDING_WORKFLOW_TYPE;

export type CustomerOnboardingActionType =
	| 'create_customer'
	| 'create_wallet'
	| 'create_subscription'
	| 'create_feature_and_price'
	| 'rollout_to_subscriptions';

export interface CustomerOnboardingActionBase {
	action: string;
	[key: string]: unknown;
}

export interface CreateWalletOnboardingAction extends CustomerOnboardingActionBase {
	action: 'create_wallet';
	currency: string;
	wallet_type?: WALLET_TYPE;
	conversion_rate?: string;
	initial_credits_to_load?: string;
	initial_credits_expiration_duration?: number;
	initial_credits_expiration_duration_unit?: CREDIT_GRANT_PERIOD_UNIT;
}

export interface CreateSubscriptionOnboardingAction extends CustomerOnboardingActionBase {
	action: 'create_subscription';
	plan_id: string;
	billing_cycle?: BILLING_CYCLE;
	start_date?: string;
}

export type CustomerOnboardingAction = CreateWalletOnboardingAction | CreateSubscriptionOnboardingAction | CustomerOnboardingActionBase;

/** Matches backend WorkflowConfig. */
export interface CustomerOnboardingConfig {
	workflow_type: CustomerOnboardingWorkflowType;
	actions: CustomerOnboardingAction[];
	custom_workflows: Record<string, CustomerOnboardingAction[]>;
}

export const DEFAULT_CUSTOMER_ONBOARDING_CONFIG: CustomerOnboardingConfig = {
	workflow_type: CUSTOMER_ONBOARDING_WORKFLOW_TYPE,
	actions: [],
	custom_workflows: {},
};

export const CUSTOM_WORKFLOW_NAME_MAX_LENGTH = 100;

/** Shared editable fields for the default workflow and each custom workflow. */
export interface CustomerOnboardingActionSetDraft {
	walletEnabled: boolean;
	walletType: WALLET_TYPE;
	walletCurrency: string;
	walletConversionRate: string;
	walletInitialCreditsToLoad: string;
	walletCreditsExpireEnabled: boolean;
	walletCreditsExpirationDuration: string;
	walletCreditsExpirationDurationUnit: CREDIT_GRANT_PERIOD_UNIT | '';
	subscriptionEnabled: boolean;
	subscriptionPlanId: string;
	subscriptionBillingCycle: BILLING_CYCLE;
	subscriptionStartDate: string;
	advancedActions: CustomerOnboardingAction[];
}

export interface CustomerOnboardingCustomWorkflowDraft extends CustomerOnboardingActionSetDraft {
	/** Local-only React key; not persisted. */
	id: string;
	/** Map key for `custom_workflows`. */
	label: string;
}

/** Editable draft form-state for the customer onboarding settings tab. */
export interface CustomerOnboardingDraft extends CustomerOnboardingActionSetDraft {
	customWorkflows: CustomerOnboardingCustomWorkflowDraft[];
}

const RFC3339_DATE_TIME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
const CREDIT_GRANT_PERIOD_UNIT_VALUES = new Set<string>(Object.values(CREDIT_GRANT_PERIOD_UNIT));

function isValidIsoDateTime(value: string): boolean {
	const trimmed = value.trim();
	return RFC3339_DATE_TIME_REGEX.test(trimmed) && Number.isFinite(Date.parse(trimmed));
}

function parseCreditsAmount(value: string | undefined): number | null {
	const trimmed = value?.trim() ?? '';
	if (!trimmed) return null;
	const amount = Number(trimmed);
	return Number.isFinite(amount) ? amount : Number.NaN;
}

/** Mirrors the old `readString`: stringifies any present value, but leaves missing/null as undefined. */
const looseOptionalString = z.preprocess(
	(value) => (value === undefined || value === null ? undefined : String(value)),
	z.string().optional(),
);
const looseRequiredString = z.preprocess((value) => (value === undefined || value === null ? '' : String(value)), z.string());
const looseBillingCycle = looseOptionalString.pipe(z.nativeEnum(BILLING_CYCLE).optional().catch(undefined));
const looseWalletType = looseOptionalString.pipe(z.nativeEnum(WALLET_TYPE).optional().catch(undefined));
const looseOptionalNumber = z.preprocess((value) => {
	if (value === undefined || value === null || value === '') return undefined;
	if (typeof value === 'number') return value;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : value;
}, z.number().optional().catch(undefined));
const looseCreditsExpirationUnit = looseOptionalString.pipe(z.nativeEnum(CREDIT_GRANT_PERIOD_UNIT).optional().catch(undefined));

// `.passthrough()` keeps any extra/unrecognized fields on the action object intact, since
// advanced (non-wallet/subscription) actions must round-trip untouched.
const createWalletActionSchema = z
	.object({
		action: z.literal('create_wallet'),
		currency: looseRequiredString,
		wallet_type: looseWalletType,
		conversion_rate: looseOptionalString,
		initial_credits_to_load: looseOptionalString,
		initial_credits_expiration_duration: looseOptionalNumber,
		initial_credits_expiration_duration_unit: looseCreditsExpirationUnit,
	})
	.passthrough();

const createSubscriptionActionSchema = z
	.object({
		action: z.literal('create_subscription'),
		plan_id: looseRequiredString,
		billing_cycle: looseBillingCycle,
		start_date: looseOptionalString,
	})
	.passthrough();

const genericActionSchema = z.object({ action: z.string() }).passthrough();

function parseAction(value: unknown): CustomerOnboardingAction | null {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
	const action = (value as Record<string, unknown>).action;
	if (action === undefined || action === null) return null;

	if (action === 'create_wallet') {
		const result = createWalletActionSchema.safeParse(value);
		return result.success ? result.data : null;
	}

	if (action === 'create_subscription') {
		const result = createSubscriptionActionSchema.safeParse(value);
		return result.success ? result.data : null;
	}

	const result = genericActionSchema.safeParse({ ...value, action: String(action) });
	return result.success ? result.data : null;
}

function parseActions(rawActions: unknown): CustomerOnboardingAction[] {
	if (!Array.isArray(rawActions)) return [];
	return rawActions.map(parseAction).filter((action): action is CustomerOnboardingAction => action !== null);
}

function parseCustomWorkflows(value: unknown): Record<string, CustomerOnboardingAction[]> {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};

	const customWorkflows: Record<string, CustomerOnboardingAction[]> = {};
	for (const [name, rawActions] of Object.entries(value as Record<string, unknown>)) {
		customWorkflows[name] = parseActions(rawActions);
	}

	return customWorkflows;
}

export function parseCustomerOnboardingConfig(value: unknown): CustomerOnboardingConfig {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		return { ...DEFAULT_CUSTOMER_ONBOARDING_CONFIG, custom_workflows: {} };
	}

	const record = value as Record<string, unknown>;

	return {
		workflow_type: CUSTOMER_ONBOARDING_WORKFLOW_TYPE,
		actions: parseActions(record.actions),
		custom_workflows: parseCustomWorkflows(record.custom_workflows),
	};
}

function normalizeAction(action: CustomerOnboardingAction): CustomerOnboardingAction {
	if (action.action === 'create_wallet') {
		const walletAction = action as CreateWalletOnboardingAction;
		const creditsAmount = parseCreditsAmount(walletAction.initial_credits_to_load);
		const hasCredits = creditsAmount !== null && Number.isFinite(creditsAmount) && creditsAmount > 0;
		const duration = walletAction.initial_credits_expiration_duration;
		const unit = walletAction.initial_credits_expiration_duration_unit;
		const hasExpiry = hasCredits && duration !== undefined && unit !== undefined;

		return {
			action: walletAction.action,
			currency: walletAction.currency.trim().toUpperCase(),
			wallet_type: walletAction.wallet_type || WALLET_TYPE.PRE_PAID,
			...(walletAction.conversion_rate?.trim() ? { conversion_rate: walletAction.conversion_rate.trim() } : {}),
			...(hasCredits ? { initial_credits_to_load: String(walletAction.initial_credits_to_load).trim() } : {}),
			...(hasExpiry
				? {
						initial_credits_expiration_duration: duration,
						initial_credits_expiration_duration_unit: unit,
					}
				: {}),
		};
	}

	if (action.action === 'create_subscription') {
		const subscriptionAction = action as CreateSubscriptionOnboardingAction;
		return {
			action: subscriptionAction.action,
			plan_id: subscriptionAction.plan_id.trim(),
			...(subscriptionAction.billing_cycle ? { billing_cycle: subscriptionAction.billing_cycle } : {}),
			...(subscriptionAction.start_date?.trim() ? { start_date: subscriptionAction.start_date.trim() } : {}),
		};
	}

	return action;
}

export function normalizeCustomerOnboardingConfig(config: CustomerOnboardingConfig): CustomerOnboardingConfig {
	return {
		workflow_type: CUSTOMER_ONBOARDING_WORKFLOW_TYPE,
		actions: config.actions.map(normalizeAction),
		custom_workflows: Object.fromEntries(
			Object.entries(config.custom_workflows ?? {}).map(([name, actions]) => [name.trim(), actions.map(normalizeAction)]),
		),
	};
}

export type CustomerOnboardingValidationErrorKey =
	| 'walletCurrencyRequired'
	| 'walletConversionRateInvalid'
	| 'walletInitialCreditsInvalid'
	| 'walletCreditsExpirationIncomplete'
	| 'walletCreditsExpirationInvalid'
	| 'walletCreditsExpirationWithoutCredits'
	| 'subscriptionPlanRequired'
	| 'subscriptionStartDateInvalid'
	| 'customWorkflowNameRequired'
	| 'customWorkflowNameInvalid'
	| 'customWorkflowNameDuplicate';

function getActionsValidationErrorKey(actions: CustomerOnboardingAction[]): CustomerOnboardingValidationErrorKey | null {
	for (const action of actions) {
		if (action.action === 'create_wallet') {
			const walletAction = action as CreateWalletOnboardingAction;
			if (!walletAction.currency.trim()) return 'walletCurrencyRequired';
			if (walletAction.conversion_rate?.trim()) {
				const conversionRate = Number(walletAction.conversion_rate);
				if (!Number.isFinite(conversionRate) || conversionRate <= 0) return 'walletConversionRateInvalid';
			}

			const creditsAmount = parseCreditsAmount(walletAction.initial_credits_to_load);
			if (creditsAmount !== null && (!Number.isFinite(creditsAmount) || creditsAmount < 0)) {
				return 'walletInitialCreditsInvalid';
			}
			const hasPositiveCredits = creditsAmount !== null && Number.isFinite(creditsAmount) && creditsAmount > 0;

			const hasDuration = walletAction.initial_credits_expiration_duration !== undefined;
			const hasUnit = walletAction.initial_credits_expiration_duration_unit !== undefined;
			if (hasDuration !== hasUnit) return 'walletCreditsExpirationIncomplete';

			if (hasDuration && hasUnit) {
				const duration = walletAction.initial_credits_expiration_duration;
				const unit = walletAction.initial_credits_expiration_duration_unit;
				if (!Number.isInteger(duration) || (duration as number) <= 0 || !CREDIT_GRANT_PERIOD_UNIT_VALUES.has(unit as string)) {
					return 'walletCreditsExpirationInvalid';
				}
				if (!hasPositiveCredits) return 'walletCreditsExpirationWithoutCredits';
			}
		}

		if (action.action === 'create_subscription') {
			const subscriptionAction = action as CreateSubscriptionOnboardingAction;
			if (!subscriptionAction.plan_id.trim()) return 'subscriptionPlanRequired';
			if (subscriptionAction.start_date?.trim() && !isValidIsoDateTime(subscriptionAction.start_date)) {
				return 'subscriptionStartDateInvalid';
			}
		}
	}

	return null;
}

/** Validates custom workflow map keys / draft names (required, max length, unique). */
export function getCustomWorkflowNamesValidationErrorKey(names: string[]): CustomerOnboardingValidationErrorKey | null {
	const seen = new Set<string>();

	for (const name of names) {
		const trimmed = name.trim();
		if (!trimmed) return 'customWorkflowNameRequired';
		if (trimmed.length > CUSTOM_WORKFLOW_NAME_MAX_LENGTH) return 'customWorkflowNameInvalid';
		if (seen.has(trimmed)) return 'customWorkflowNameDuplicate';
		seen.add(trimmed);
	}

	return null;
}

export function getCustomerOnboardingValidationErrorKey(config: CustomerOnboardingConfig): CustomerOnboardingValidationErrorKey | null {
	const defaultError = getActionsValidationErrorKey(config.actions);
	if (defaultError) return defaultError;

	const customWorkflows = config.custom_workflows ?? {};
	const nameError = getCustomWorkflowNamesValidationErrorKey(Object.keys(customWorkflows));
	if (nameError) return nameError;

	for (const actions of Object.values(customWorkflows)) {
		const setError = getActionsValidationErrorKey(actions);
		if (setError) return setError;
	}

	return null;
}
