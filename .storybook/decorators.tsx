import type { Decorator } from '@storybook/react-vite';
import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import { DirectionProvider } from '@radix-ui/react-direction';
import { MemoryRouter } from 'react-router';
import ReactQueryProvider from '../src/core/services/tanstack/ReactQueryProvider';
import { UserProvider } from '../src/hooks/UserContext';
import { storybookI18n, directionFor } from './i18n';

/**
 * Mirrors the provider stack that main.tsx + App.tsx mount around the real app.
 *
 * Without it, most of the library is un-storyable: 260 of ~350 components call `useTranslation`,
 * 102 call `useQuery`/`useMutation`, and 38 reach for router hooks. Any of those throws or renders
 * raw i18n keys when mounted bare.
 *
 * `MemoryRouter` rather than `BrowserRouter` so navigation inside a story stays in the story and
 * can't rewrite Storybook's own URL (which is where the selected story lives).
 */
export const withProviders: Decorator = (Story) => (
	<I18nextProvider i18n={storybookI18n}>
		<ReactQueryProvider>
			<UserProvider>
				<MemoryRouter initialEntries={['/']}>
					<Story />
					{/* Portalled dialogs/sheets mount into #modal-root, same as index.html provides in the app. */}
					<div id='modal-root' />
				</MemoryRouter>
			</UserProvider>
		</ReactQueryProvider>
	</I18nextProvider>
);

/**
 * Applies the selected locale to i18next and to `<html lang/dir>`, and feeds direction to Radix.
 *
 * Radix primitives read direction from context, not from the DOM, so the `DirectionProvider` is what
 * actually makes RTL stories behave — the `lang`/`dir` attributes are for CSS logical properties
 * and for anything reading the document directly.
 */
function LocaleBoundary({ locale, children }: { locale: string; children: React.ReactNode }) {
	const direction = directionFor(locale);

	useEffect(() => {
		void storybookI18n.changeLanguage(locale);
		document.documentElement.lang = locale;
		document.documentElement.dir = direction;
	}, [locale, direction]);

	return <DirectionProvider dir={direction}>{children}</DirectionProvider>;
}

// A decorator isn't a component as far as the rules-of-hooks lint is concerned, so the effect lives
// in `LocaleBoundary` rather than inline here.
export const withLocale: Decorator = (Story, context) => (
	<LocaleBoundary locale={(context.globals.locale as string) ?? 'en'}>
		<Story />
	</LocaleBoundary>
);

/**
 * Paints the story canvas with the themed app surface.
 *
 * `@storybook/addon-themes`' `withThemeByClassName` puts `.dark` on `<html>` (see preview.tsx), which
 * re-points the tokens — but the preview iframe's own body has no background of its own, so a dark
 * story would otherwise render dark-on-white. This is the equivalent of the app's page shell.
 */
export const withCanvas: Decorator = (Story, context) => {
	const layout = context.parameters.layout as string | undefined;
	const padded = layout !== 'fullscreen';

	return (
		// `bg-surface-canvas`/`text-content` rather than `bg-background`/`text-foreground`: the shadcn
		// `--background` var is authored as a raw hex in light mode but HSL channels in dark, so
		// `hsl(var(--background))` only resolves in dark. The `--fp-*` tokens are well-formed in both.
		<div className={`bg-surface-canvas text-content font-sans ${padded ? 'p-6' : ''}`} style={{ minHeight: padded ? undefined : '100vh' }}>
			<Story />
		</div>
	);
};
