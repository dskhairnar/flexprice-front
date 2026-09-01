// Reusable Vite library-build template for exportable component libraries.
//
// Instead of copy-pasting a whole Vite config per component, call this factory:
//   import { createLibConfig } from './vite.lib.base';
//   export default createLibConfig({ entry: 'src/foo/lib.ts', name: 'FlexpriceFooUI',
//     fileName: 'flexprice-foo', outDir: 'packages/foo-ui/dist', tailwindConfig: 'tailwind.foo.config.js',
//     dtsInclude: ['src/foo/**/*.ts', 'src/foo/**/*.tsx'], tsconfigPath: 'tsconfig.foo.json' });
//
// All paths are resolved from the repo root via path.resolve(__dirname, ...), so a component config
// living at the repo root can pass plain repo-relative strings regardless of where it imports this from.
import { defineConfig, type UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export interface CreateLibConfigOptions {
	/** Path to the lib entry, e.g. 'src/exportable/index.ts'. */
	entry: string;
	/** UMD global name, e.g. 'FlexpricePricingUI'. */
	name: string;
	/** Base output filename, e.g. 'flexprice-ui'. */
	fileName: string;
	/** Output directory, e.g. 'packages/flexprice-ui/dist'. */
	outDir: string;
	/** Path to the component's Tailwind config, e.g. 'tailwind.flexprice-ui.config.js'. */
	tailwindConfig: string;
	/** Glob array for vite-plugin-dts include, e.g. ['src/exportable/**\/*.ts', 'src/pricing/**\/*.tsx']. */
	dtsInclude: string[];
	/** Path to the component's tsconfig used for dts, e.g. 'tsconfig.flexprice-ui.json'. */
	tsconfigPath: string;
}

export function createLibConfig(opts: CreateLibConfigOptions): UserConfig {
	const { entry, name, fileName, outDir, tailwindConfig, dtsInclude, tsconfigPath } = opts;

	return defineConfig({
		plugins: [
			react(),
			dts({
				// Roll every referenced type (incl. @/* aliases) into a single self-contained index.d.ts.
				rollupTypes: true,
				insertTypesEntry: true,
				include: dtsInclude,
				tsconfigPath: resolve(__dirname, tsconfigPath),
			}),
		],
		// Library build — do not copy the app's public/ assets into the package.
		publicDir: false,
		resolve: {
			alias: { '@': resolve(__dirname, 'src') },
		},
		css: {
			postcss: {
				plugins: [tailwindcss({ config: resolve(__dirname, tailwindConfig) }), autoprefixer()],
			},
		},
		build: {
			outDir: resolve(__dirname, outDir),
			emptyOutDir: true,
			sourcemap: true,
			lib: {
				entry: resolve(__dirname, entry),
				name,
				formats: ['es', 'umd'],
				// UMD is emitted as `.cjs` so a CommonJS `require()` consumer loads it correctly under
				// this package's `"type": "module"` (a `.js` UMD file would be parsed as ESM and throw).
				fileName: (format) => (format === 'es' ? `${fileName}.mjs` : `${fileName}.cjs`),
				cssFileName: 'style',
			},
			rollupOptions: {
				// Only react / react-dom are peer externals. `react/jsx-runtime` is intentionally NOT
				// externalized: the automatic JSX runtime has no UMD/global equivalent, so externalizing
				// it produces a broken UMD/CJS bundle ("jsxRuntime is not defined"). Bundling its tiny
				// shim (which defers to the external React) keeps the UMD build valid without forcing the
				// whole codebase onto the classic runtime.
				external: ['react', 'react-dom'],
				output: {
					globals: { react: 'React', 'react-dom': 'ReactDOM' },
				},
			},
		},
	});
}
