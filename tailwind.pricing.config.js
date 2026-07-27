// Scoped Tailwind config for the @flexprice/pricing-ui library build.
//
// Reuses the app's theme (tokens, radii, fonts) but only scans the files the pricing widget
// actually renders, so the emitted `style.css` stays lean instead of shipping every utility
// used across the dashboard.
//
// Thin consumer of the shared library Tailwind template in tailwind.lib.base.js.
import { createLibTailwindConfig } from './tailwind.lib.base.js';

export default createLibTailwindConfig([
	'./src/pricing/**/*.{ts,tsx}',
	'./src/components/molecules/PricingCard/**/*.{ts,tsx}',
	'./src/components/ui/**/*.{ts,tsx}',
	'./src/components/atoms/Select/**/*.{ts,tsx}',
	'./src/components/atoms/Input/**/*.{ts,tsx}',
	'./src/components/atoms/Label/**/*.{ts,tsx}',
]);
