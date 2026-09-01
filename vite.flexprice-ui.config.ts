// Library build for @flexprice/ui (the umbrella package of all exportable components).
//
// Run: `npm run build:ui`. Emits an installable React UI package (ESM + UMD + CSS + types) into
// packages/flexprice-ui/dist. React is externalized (peer dependency); everything the components
// use is bundled, so consumers only need React + one CSS import.
//
// Single package for ALL exported components: the entry is the umbrella `src/exportable/index.ts`,
// so adding a component = one export line there + its content globs in the tailwind config below.
// Thin consumer of the shared library-build template in vite.lib.base.ts.
import { createLibConfig } from './vite.lib.base';

export default createLibConfig({
	entry: 'src/exportable/index.ts',
	name: 'FlexpriceUI',
	fileName: 'flexprice-ui',
	outDir: 'packages/flexprice-ui/dist',
	tailwindConfig: 'tailwind.flexprice-ui.config.js',
	// dts follows the umbrella entry into each feature's lib.ts — include every exportable source.
	dtsInclude: [
		'src/exportable/**/*.ts',
		'src/exportable/**/*.tsx',
		'src/pricing/**/*.ts',
		'src/pricing/**/*.tsx',
		'src/usage/**/*.ts',
		'src/usage/**/*.tsx',
		'src/credits/**/*.ts',
		'src/credits/**/*.tsx',
	],
	tsconfigPath: 'tsconfig.flexprice-ui.json',
});
