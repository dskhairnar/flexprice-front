/**
 * React Query keys for customer portal.
 * Shared so widgets and pages can deduplicate cache (e.g. CustomerPortal pre-fetch + InvoicesWidget).
 */
export const portalInvoicesQueryKey = ['portal-invoices-tab'] as const;

/** Matches the key the existing wallet widgets already use — do not change in isolation. */
export const portalWalletsQueryKey = ['portal-wallets'] as const;

export const portalPaymentMethodsQueryKey = ['portal-payment-methods'] as const;

export const portalWalletBalanceQueryKey = (walletId?: string) => ['portal-wallet-balance', walletId] as const;
