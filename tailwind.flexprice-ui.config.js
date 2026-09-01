// Scoped Tailwind config for the @flexprice/ui library build.
//
// Reuses the app's theme (tokens, radii, fonts) but only scans the files the exported components
// actually render, so the emitted `style.css` stays lean. When a new component becomes exportable,
// add its source globs here so its utilities are compiled into the shipped stylesheet.
//
// Thin consumer of the shared library Tailwind template in tailwind.lib.base.js.
import { createLibTailwindConfig } from './tailwind.lib.base.js';

export default {
	...createLibTailwindConfig([
		'./src/exportable/**/*.{ts,tsx}',
		// Pricing widget + the shared atoms/ui it renders.
		'./src/pricing/**/*.{ts,tsx}',
		'./src/components/molecules/PricingCard/**/*.{ts,tsx}',
		// Usage widgets + the shared atoms/molecules/ui they render.
		'./src/usage/**/*.{ts,tsx}',
		'./src/components/molecules/CustomerUsageChart.tsx',
		'./src/components/molecules/CustomerUsageChart.i18n.ts',
		'./src/components/molecules/MetricCard.tsx',
		'./src/components/molecules/Table/**/*.{ts,tsx}',
		'./src/components/atoms/Card/**/*.{ts,tsx}',
		'./src/components/atoms/Progress/**/*.{ts,tsx}',
		'./src/components/ui/**/*.{ts,tsx}',
		'./src/components/atoms/Select/**/*.{ts,tsx}',
		'./src/components/atoms/Input/**/*.{ts,tsx}',
		'./src/components/atoms/Label/**/*.{ts,tsx}',
		// Credits widgets + the shared atoms/molecules/ui they render.
		'./src/credits/**/*.{ts,tsx}',
		'./src/components/molecules/Wallet/WalletTransactionsTable.tsx',
		'./src/components/molecules/Wallet/WalletTransactionsTable.i18n.ts',
		'./src/components/atoms/ShortPagination/**/*.{ts,tsx}',
		'./src/components/atoms/Chip/**/*.{ts,tsx}',
	]),
	// Tailwind's Preflight base reset must not ship into a consumer's page — it would reset the
	// host's own margins, headings, borders, etc. The library instead scopes its own minimal reset
	// under the `.flexprice-ui` wrapper class (see `src/exportable/styles.css`).
	corePlugins: { preflight: false },
};
