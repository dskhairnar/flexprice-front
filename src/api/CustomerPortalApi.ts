import { AxiosClient } from '@/core/axios/verbs';
import { Customer, Invoice, RealtimeWalletBalance } from '@/models';
import { UpdateCustomerRequest, GetUsageSummaryResponse } from '@/types/dto';
import {
	GetCustomerUsageSummaryRequest,
	DashboardPaginatedRequest,
	DashboardAnalyticsRequest,
	DashboardCostAnalyticsRequest,
} from '@/types';
import { SubscriptionResponse, ListSubscriptionsResponse } from '@/types/dto/Subscription';
import { GetInvoicesResponse } from '@/types/dto/InvoiceApi';
import { WalletResponse, WalletTransactionResponse } from '@/types/dto/Wallet';
import { GetUsageAnalyticsResponse } from '@/types/dto/Events';
import { GetDetailedCostAnalyticsResponse } from '@/types/dto/Cost';
import { generateQueryParams } from '@/utils/common/api_helper';
import { PortalConfig, DEFAULT_PORTAL_CONFIG, deepMergePortalConfig } from '@/types/dto/PortalConfig';
import {
	PortalTopUpRequest,
	PortalTopUpResponse,
	PortalAutoTopupRequest,
	PortalPaymentMethodsResponse,
	PortalListPaymentMethodsQuery,
	PortalAddPaymentMethodRequest,
	PortalSetupIntentResponse,
	PortalSetDefaultPaymentMethodRequest,
	PortalPayInvoiceRequest,
	PortalPayInvoiceResponse,
} from '@/types/dto/CustomerPortalBilling';

/**
 * CustomerPortalApi - Customer-facing dashboard APIs
 * All methods require dashboard token authentication (set via setRuntimeCredentials)
 */
class CustomerPortalApi {
	private static baseUrl = '/customer/portal';

	/**
	 * Get the authenticated customer's information
	 */
	public static async getCustomer(): Promise<Customer> {
		return await AxiosClient.get<Customer>(`${this.baseUrl}/info`);
	}

	/**
	 * Update the authenticated customer's information
	 */
	public static async updateCustomer(payload: UpdateCustomerRequest): Promise<Customer> {
		return await AxiosClient.put<Customer>(`${this.baseUrl}/info`, payload);
	}

	/**
	 * Get usage summary for the authenticated customer
	 */
	public static async getUsageSummary(query?: GetCustomerUsageSummaryRequest): Promise<GetUsageSummaryResponse> {
		const url = generateQueryParams(`${this.baseUrl}/usage`, query || {});
		return await AxiosClient.get<GetUsageSummaryResponse>(url);
	}

	/**
	 * Get subscriptions for the authenticated customer with pagination
	 */
	public static async getSubscriptions(payload: DashboardPaginatedRequest): Promise<ListSubscriptionsResponse> {
		return await AxiosClient.post<ListSubscriptionsResponse>(`${this.baseUrl}/subscriptions`, payload);
	}

	/**
	 * Get a specific subscription by ID for the authenticated customer
	 */
	public static async getSubscription(id: string): Promise<SubscriptionResponse> {
		return await AxiosClient.get<SubscriptionResponse>(`${this.baseUrl}/subscriptions/${id}`);
	}

	/**
	 * Get invoices for the authenticated customer with pagination
	 */
	public static async getInvoices(payload: DashboardPaginatedRequest): Promise<GetInvoicesResponse> {
		return await AxiosClient.post<GetInvoicesResponse>(`${this.baseUrl}/invoices`, payload);
	}

	/**
	 * Get a specific invoice by ID for the authenticated customer
	 */
	public static async getInvoice(id: string): Promise<Invoice> {
		return await AxiosClient.get<Invoice>(`${this.baseUrl}/invoices/${id}`);
	}

	/**
	 * Get wallets for the authenticated customer
	 */
	public static async getWallets(): Promise<WalletResponse[]> {
		return await AxiosClient.post<WalletResponse[]>(`${this.baseUrl}/wallets`, {});
	}

	/**
	 * Get a specific wallet by ID for the authenticated customer
	 */
	public static async getWallet(id: string): Promise<WalletResponse> {
		return await AxiosClient.get<WalletResponse>(`${this.baseUrl}/wallets/${id}`);
	}

	/**
	 * Get usage analytics for the authenticated customer
	 */
	public static async getAnalytics(payload: DashboardAnalyticsRequest): Promise<GetUsageAnalyticsResponse> {
		return await AxiosClient.post<GetUsageAnalyticsResponse>(`${this.baseUrl}/analytics/revenue`, payload);
	}

	/**
	 * Get cost analytics for the authenticated customer
	 */
	public static async getCostAnalytics(payload: DashboardCostAnalyticsRequest): Promise<GetDetailedCostAnalyticsResponse> {
		return await AxiosClient.post<GetDetailedCostAnalyticsResponse>(`${this.baseUrl}/analytics/cost`, payload);
	}

	/**
	 * Get a presigned URL for downloading an invoice PDF for the authenticated customer
	 */
	public static async downloadInvoicePdf(invoiceId: string): Promise<void> {
		const url = generateQueryParams(`${this.baseUrl}/invoices/${invoiceId}/pdf`, { url: true });
		const response = await AxiosClient.get<{ presigned_url: string }>(url);
		const presignedUrl = response.presigned_url;
		window.open(presignedUrl, '_blank');
	}

	/**
	 * Get real-time balance for a wallet belonging to the authenticated customer
	 */
	public static async getWalletBalance(walletId: string): Promise<RealtimeWalletBalance> {
		return await AxiosClient.get<RealtimeWalletBalance>(`${this.baseUrl}/wallets/${walletId}`);
	}

	/**
	 * Get transactions for a wallet belonging to the authenticated customer with pagination
	 */
	public static async getWalletTransactions(payload: {
		walletId: string;
		limit?: number;
		offset?: number;
	}): Promise<WalletTransactionResponse> {
		const { walletId, limit = 10, offset = 0 } = payload;
		const url = generateQueryParams(`${this.baseUrl}/wallets/${walletId}/transactions`, { limit, offset });
		return await AxiosClient.get<WalletTransactionResponse>(url);
	}

	/**
	 * Top up a wallet belonging to the authenticated customer.
	 *
	 * Pass `checkout` to charge the customer through a hosted checkout session —
	 * credits are applied only after the payment succeeds, and the response carries
	 * the session to redirect to. Omit it for the invoiced pay-later flow.
	 */
	public static async topUpWallet(walletId: string, payload: PortalTopUpRequest): Promise<PortalTopUpResponse> {
		return await AxiosClient.post<PortalTopUpResponse>(`${this.baseUrl}/wallets/${walletId}/top-up`, payload);
	}

	/**
	 * Configure auto top-up on a wallet belonging to the authenticated customer.
	 */
	public static async updateAutoTopup(walletId: string, payload: PortalAutoTopupRequest): Promise<WalletResponse> {
		return await AxiosClient.put<WalletResponse>(`${this.baseUrl}/wallets/${walletId}/auto-topup`, payload);
	}

	/**
	 * Attempt payment for an invoice belonging to the authenticated customer.
	 */
	public static async payInvoice(invoiceId: string): Promise<{ message: string }> {
		return await AxiosClient.post<{ message: string }>(`${this.baseUrl}/invoices/${invoiceId}/payment/attempt`, {});
	}

	/**
	 * Start a hosted payment for one of the customer's invoices. Returns the URL to
	 * redirect to; the caller also surfaces it so a blocked redirect leaves the
	 * customer a link they can open by hand.
	 */
	public static async payInvoiceWithCheckout(invoiceId: string, payload: PortalPayInvoiceRequest): Promise<PortalPayInvoiceResponse> {
		return await AxiosClient.post<PortalPayInvoiceResponse>(`${this.baseUrl}/invoices/${invoiceId}/pay`, payload);
	}

	/**
	 * List saved payment methods for the authenticated customer, grouped by provider.
	 */
	public static async getPaymentMethods(query?: PortalListPaymentMethodsQuery): Promise<PortalPaymentMethodsResponse> {
		const url = generateQueryParams(`${this.baseUrl}/payment-methods`, query || {});
		return await AxiosClient.get<PortalPaymentMethodsResponse>(url);
	}

	/**
	 * Start a hosted card-capture session so the customer can add a payment method.
	 * The caller redirects to `checkout_url`; the card is saved off-session so it can
	 * back auto top-up later.
	 */
	public static async addPaymentMethod(payload: PortalAddPaymentMethodRequest = {}): Promise<PortalSetupIntentResponse> {
		return await AxiosClient.post<PortalSetupIntentResponse>(`${this.baseUrl}/payment-methods/setup`, payload);
	}

	/**
	 * Mark one of the customer's saved payment methods as the default for future charges.
	 */
	public static async setDefaultPaymentMethod(payload: PortalSetDefaultPaymentMethodRequest): Promise<{ message: string }> {
		return await AxiosClient.post<{ message: string }>(`${this.baseUrl}/payment-methods/default`, payload);
	}

	/**
	 * Get the portal configuration for this tenant.
	 * Backend merges tenant-specific config with defaults and returns the resolved PortalConfig.
	 * Falls back to DEFAULT_PORTAL_CONFIG on any error (no config stored, expired token, etc.)
	 */
	public static async getConfig(): Promise<PortalConfig> {
		try {
			const response = await AxiosClient.get<{ value: Partial<PortalConfig> }>(`${this.baseUrl}/config`);
			if (response?.value) {
				return deepMergePortalConfig(DEFAULT_PORTAL_CONFIG, response.value);
			}
			return DEFAULT_PORTAL_CONFIG;
		} catch {
			// No config stored yet or network error — use bundled defaults silently
			return DEFAULT_PORTAL_CONFIG;
		}
	}
}

export default CustomerPortalApi;
