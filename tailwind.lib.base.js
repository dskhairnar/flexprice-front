// Reusable Tailwind config template for exportable component libraries.
//
// Reuses the app's theme (tokens, radii, fonts) from ./tailwind.config.js but lets each component
// narrow `content` to only the files it renders, so its emitted style.css stays lean. Usage:
//   import { createLibTailwindConfig } from './tailwind.lib.base.js';
//   export default createLibTailwindConfig(['./src/foo/**/*.{ts,tsx}', './src/components/ui/**/*.{ts,tsx}']);
import baseConfig from './tailwind.config.js';

export function createLibTailwindConfig(contentGlobs) {
	return {
		...baseConfig,
		content: contentGlobs,
	};
}
