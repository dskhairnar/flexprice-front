/**
 * Customer Portal billing DTOs — top-up, auto top-up, and payment methods.
 *
 * These mirror the /v1/customer/portal endpoints, which reuse the same backend
 * services as the admin API but resolve the customer from the session token.
 */
import { AutoTopup } from '@/models/Wallet';
import { WalletResponse } from './Wallet';

// ─── Top up ───────────────────────────────────────────────────────────────────

/**
 * Hosted-checkout opt-in for a top-up. When present the credits land only after
 * the payment succeeds; when omitted the top-up is invoiced pay-later.
 */
export interface PortalCheckoutParams {
	payment_provider: string;
	success_url?: string;
	cancel_url?: string;
	failure_url?: string;
	idempotency_key?: string;
	metadata?: Record<string, string>;
}

/**
 * Note there is no transaction_reason: the backend pins it to a purchased-credit
 * top-up so a portal customer cannot grant themselves free credits.
 */
export interface PortalTopUpRequest {
	credits_to_add: string;
	amount?: string;
	description?: string;
	/** Required: the backend's fallback key is timestamp-derived, so a retry without
	 *  this would be treated as a fresh top-up and grant the credits twice. */
	idempotency_key: string;
	checkout?: PortalCheckoutParams;
}

export interface PortalCheckoutSession {
	id: string;
	status?: string;
	payment_url?: string;
	payment_action?: {
		type?: string;
		redirect_url?: string;
	};
}

export interface PortalTopUpResponse {
	wallet_transaction?: {
		id: string;
		amount: string;
		credits: string;
		transaction_status?: string;
	};
	invoice_id?: string;
	wallet?: WalletResponse;
	checkout_session?: PortalCheckoutSession;
}

// ─── Auto top-up ──────────────────────────────────────────────────────────────

export interface PortalAutoTopupRequest {
	auto_topup: AutoTopup;
}

// ─── Payment methods ──────────────────────────────────────────────────────────

export interface PortalCardDetails {
	brand: string;
	last4: string;
	exp_month: number;
	exp_year: number;
	fingerprint?: string;
}

export interface PortalPaymentMethodDetails {
	id: string;
	type: string;
	customer?: string;
	created?: number;
	card?: PortalCardDetails;
}

export interface PortalPaymentMethod {
	id: string;
	status: string;
	usage?: string;
	customer_id: string;
	payment_method_id?: string;
	payment_method_details?: PortalPaymentMethodDetails;
	is_default: boolean;
	created_at: number;
}

/** Payment methods grouped by provider. Only Stripe is populated today. */
export interface PortalPaymentMethodsResponse {
	stripe?: PortalPaymentMethod[];
}

export interface PortalListPaymentMethodsQuery {
	provider?: string;
	limit?: number;
	starting_after?: string;
	ending_before?: string;
}

export interface PortalAddPaymentMethodRequest {
	provider?: string;
	success_url?: string;
	cancel_url?: string;
	set_default?: boolean;
}

export interface PortalSetupIntentResponse {
	setup_intent_id: string;
	checkout_session_id: string;
	checkout_url: string;
	client_secret?: string;
	status: string;
	usage: string;
	customer_id: string;
}

export interface PortalSetDefaultPaymentMethodRequest {
	payment_method_id: string;
}
