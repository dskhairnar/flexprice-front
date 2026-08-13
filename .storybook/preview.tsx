// The app's real stylesheet — Tailwind's three layers PLUS the ~234 `--fp-*` / shadcn design tokens
// and the Geist/Fira webfont imports. Importing `tailwindcss/tailwind.css` instead (the previous
// setup) gives you utilities whose values are all undefined: `bg-surface-canvas` resolves to
// `rgb( / 1)`, `font-sans` falls back to Times.
import '../src/index.css';

import type { Preview } from '@storybook/react-vite';
import { withThemeByClassName } from '@storybook/addon-themes';
import { withProviders, withLocale, withCanvas } from './decorators';
import { AVAILABLE_LOCALES } from './i18n';

const preview: Preview = {
	// Every story gets a generated Docs page unless it opts out with `tags: ['!autodocs']`.
	tags: ['autodocs'],

	parameters: {
		layout: 'centered',
		controls: {
			expanded: true,
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
		// 'todo' surfaces violations in the a11y panel without failing `build-storybook`. Flip to
		// 'error' once the existing components are clean.
		a11y: { test: 'todo' },
		options: {
			storySort: {
				order: ['Introduction', 'Design System', ['Overview', 'Colors', 'Typography', 'Spacing'], 'Atoms', 'Molecules', 'Organisms', '*'],
			},
		},
		viewport: {
			options: {
				mobile: { name: 'Mobile', styles: { width: '375px', height: '812px' } },
				tablet: { name: 'Tablet', styles: { width: '768px', height: '1024px' } },
				desktop: { name: 'Desktop', styles: { width: '1280px', height: '800px' } },
			},
		},
	},

	globalTypes: {
		locale: {
			description: 'Active locale — `ar` also flips the whole canvas to RTL.',
			toolbar: {
				title: 'Locale',
				icon: 'globe',
				items: AVAILABLE_LOCALES.map((locale) => ({ value: locale, title: locale.toUpperCase() })),
				dynamicTitle: true,
			},
		},
	},

	initialGlobals: {
		locale: 'en',
	},

	// Applied innermost-first: the canvas sits inside the providers, which sit inside the locale and
	// theme wrappers.
	decorators: [
		withCanvas,
		withProviders,
		withLocale,
		// Puts `.dark` on <html>, exactly like the app's `initTheme()` does — Tailwind is configured
		// `darkMode: ['class']`, so this is the single switch that re-points every token.
		//
		// `light` must be a real class name, not ''. The addon calls `classList.remove(value)` for
		// every theme before adding the active one, and `remove('')` throws — which silently kills the
		// decorator, leaving the toolbar toggling a global that never reaches the DOM. Nothing in the
		// stylesheet keys off `.light`, so the class is inert.
		withThemeByClassName({
			themes: { light: 'light', dark: 'dark' },
			defaultTheme: 'light',
			parentSelector: 'html',
		}),
	],
};

export default preview;
