// Library build for @flexprice/pricing-ui.
//
// Run: `npm run build:pricing`. Emits an installable React UI package (ESM + UMD + CSS + types)
// into packages/pricing-ui/dist. React is externalized (peer dependency); everything else the
// widget uses is bundled, so consumers only need React + one CSS import.
//
// Thin consumer of the shared library-build template in vite.lib.base.ts.
import { createLibConfig } from './vite.lib.base';

export default createLibConfig({
	entry: 'src/pricing/lib.ts',
	name: 'FlexpricePricingUI',
	fileName: 'flexprice-pricing',
	outDir: 'packages/pricing-ui/dist',
	tailwindConfig: 'tailwind.pricing.config.js',
	dtsInclude: ['src/pricing/**/*.ts', 'src/pricing/**/*.tsx'],
	tsconfigPath: 'tsconfig.pricing.json',
});
