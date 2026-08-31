// src/credits/i18n.ts
//
// Bundled i18n so the credits widgets render real English out-of-the-box for external consumers —
// WITHOUT overriding a host app that has its own i18n (the dashboard localizes these to Arabic).
// Mirrors `src/usage/i18n.ts`. Namespace stays `'common'` so a host dashboard's own `common`
// bundle is reused for the handoff check; the bundled English defaults live under
// `common.creditWidgets`.
//
// IMPORTANT: whenever a key is added here, the matching key MUST also be added to
// `src/i18n/locales/en/common.json` and `src/i18n/locales/ar/common.json` in the same commit —
// see this plan's Global Constraints for why (a Critical bug in the usage-widgets plan shipped
// from skipping this).
import { createBundledT } from '@/lib/exportable/bundledI18n';

/** English defaults for the keys the credits widgets render (mirror of dashboard `customer-portal.wallet`). Extended by Task 2. */
const EN_CREDIT_WIDGETS = {
	defaultName: 'Wallet',
	balance: 'Balance',
	credits: 'credits',
	valueSuffix: 'value',
	emptyTitle: 'No wallet',
	emptyDescription: 'No wallet has been set up for this account',
	// Nested, not flat dot-notation keys: the component looks these up as
	// `t('creditWidgets.status.${status}')`, and i18next's default keySeparator ('.') resolves
	// that as a nested path (creditWidgets -> status -> active), not a literal flat key named
	// "status.active".
	status: {
		active: 'Active',
		frozen: 'Frozen',
		closed: 'Closed',
	},
	transactionHistory: 'Transaction History',
	transactionsUnit: 'Transactions',
	noTransactionsTitle: 'No transactions',
	noTransactionsDescription: 'Your transaction history will appear here',
	fallbackWalletName: 'Wallet {{id}}',
	overdrawnHint: 'Your current usage exceeds available credits.',
};

export const useCreditsT = createBundledT('common', { creditWidgets: EN_CREDIT_WIDGETS }).useBoundT;
