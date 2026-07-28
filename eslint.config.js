// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from 'eslint-plugin-storybook';

import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import i18next from 'eslint-plugin-i18next';

/** `jsx-only`: flags string literals on selected JSX props (placeholder, aria-*, alt, …), not every TS string. */
const noLiteralString = [
	'error',
	{
		mode: 'jsx-only',
		'jsx-attributes': {
			include: [
				'placeholder',
				'title',
				'aria-label',
				'aria-placeholder',
				'aria-roledescription',
				'aria-valuetext',
				'alt',
				'label',
				'description',
			],
		},
		callees: {
			exclude: [
				'^t$',
				'^tc$',
				'^i18n\\.t$',
				'window\\..*',
				'console\\..*',
				'Object\\..*',
				'Array\\..*',
				'Math\\..*',
				'JSON\\..*',
				'toast\\..*',
				'cn',
				'clsx',
				'cva',
				'navigate',
				'setTimeout',
				'setInterval',
				'clearInterval',
				'clearTimeout',
				'addEventListener',
				'removeEventListener',
				'dispatchEvent',
				'new RegExp',
				'new Error',
				'new URL',
				'new Date',
				'require',
			],
		},
		words: {
			exclude: ['^.$', '^\\s*$', '^https?://', '^#[a-fA-F0-9]{3,8}$'],
		},
		'jsx-components': {
			exclude: ['Trans', 'Route', 'Navigate'],
		},
	},
];

export default tseslint.config(
	{ ignores: ['dist'] },
	{
		extends: [js.configs.recommended, ...tseslint.configs.recommended],
		files: ['**/*.{ts,tsx}'],
		languageOptions: {
			ecmaVersion: 2020,
			globals: globals.browser,
		},
		plugins: {
			'react-hooks': reactHooks,
			'react-refresh': reactRefresh,
			i18next,
		},
		rules: {
			...reactHooks.configs.recommended.rules,
			// eslint-plugin-react-hooks v7's recommended set adds the full React Compiler
			// readiness ruleset (purity/immutability/refs/set-state-in-effect/etc.) as errors.
			// Keep those as warnings for now — adopting them as hard errors is a separate,
			// much larger refactor than what pulled in this major version bump.
			'react-hooks/set-state-in-effect': 'warn',
			'react-hooks/set-state-in-render': 'warn',
			'react-hooks/refs': 'warn',
			'react-hooks/purity': 'warn',
			'react-hooks/immutability': 'warn',
			'react-hooks/globals': 'warn',
			'react-hooks/static-components': 'warn',
			'react-hooks/use-memo': 'warn',
			'react-hooks/preserve-manual-memoization': 'warn',
			'react-hooks/error-boundaries': 'warn',
			'react-hooks/config': 'warn',
			'react-hooks/gating': 'warn',
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
			'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
			'i18next/no-literal-string': noLiteralString,
		},
	},
	{
		files: ['**/*.{test,spec}.{ts,tsx}', 'src/tests/**/*.{ts,tsx}'],
		rules: { 'i18next/no-literal-string': 'off' },
	},
	{
		files: ['**/*Demo.{ts,tsx}'],
		rules: { 'i18next/no-literal-string': 'off' },
	},
	storybook.configs['flat/recommended'],
);
