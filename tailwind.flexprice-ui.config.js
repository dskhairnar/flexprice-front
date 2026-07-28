// Scoped Tailwind config for the @flexprice/flexprice-ui library build.
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
		'./src/components/ui/**/*.{ts,tsx}',
		'./src/components/atoms/Select/**/*.{ts,tsx}',
		'./src/components/atoms/Input/**/*.{ts,tsx}',
		'./src/components/atoms/Label/**/*.{ts,tsx}',
	]),
	// Do NOT ship Tailwind's global Preflight into a consumer's page — it would reset the host's
	// margins, headings, borders, etc. The package instead scopes its own minimal reset + theme
	// tokens under the `.flexprice-ui` wrapper class (see src/exportable/styles.css).
	corePlugins: { preflight: false },
};
