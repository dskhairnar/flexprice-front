// src/credits/lib.ts
//
// Credits widgets — FEATURE public surface (presentational only).
//
// Aggregated into the published package via `src/exportable/index.ts` (@flexprice/ui).
// Exposes ONLY prop-only UI + pure helpers, so the published bundle never drags in the dashboard's
// data layer (axios/auth/router/react-query). "Bring your own data": fetch wallets/transactions
// however you like, map them to the widgets' presentational shapes (via the exported adapters, or
// build the shapes yourself), and render.
//
// Containers (dashboard-only, data-connected) live in `./containers/` and are intentionally NOT
// re-exported here.

export { default as CreditBalance } from './components/CreditBalance';
export { default as CreditHistory } from './components/CreditHistory';

export type { CreditBalanceData, CreditBalanceProps } from './types';
export type { CreditTransaction, CreditWalletOption, CreditHistoryProps } from './types';

export { normalizeCreditBalanceData, normalizeCreditTransactions } from './schema';

export { adaptCreditBalance, adaptCreditTransactions, adaptWalletOptions } from './adapters';
