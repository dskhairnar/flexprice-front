import type { StorybookConfig } from '@storybook/react-vite';
import remarkGfm from 'remark-gfm';

const config: StorybookConfig = {
	stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
	addons: [
		'@chromatic-com/storybook',
		{
			name: '@storybook/addon-docs',
			// Storybook's MDX pipeline is CommonMark-only out of the box, so a `| a | b |` table in a
			// docs page renders as a run of literal pipes. GFM also brings strikethrough and task lists.
			options: { mdxPluginOptions: { mdxCompileOptions: { remarkPlugins: [remarkGfm] } } },
		},
		'@storybook/addon-a11y',
		'@storybook/addon-themes',
	],
	framework: {
		name: '@storybook/react-vite',
		options: {},
	},
	// Components reference public assets by absolute path (e.g. `src='/assets/logo/slack-logo.png'`
	// in ContactUsDialog). Without this they 404 inside the preview iframe.
	staticDirs: ['../public'],
	typescript: {
		// react-docgen-typescript reads the real prop types + JSDoc off each component, which is what
		// fills the Controls table. The default `react-docgen` parser leaves every prop as `unknown`.
		reactDocgen: 'react-docgen-typescript',
		reactDocgenTypescriptOptions: {
			shouldExtractLiteralValuesFromEnum: true,
			shouldRemoveUndefinedFromOptional: true,
			// Skip props inherited from node_modules types (React.HTMLAttributes etc.) — otherwise every
			// story's Controls table is 200 rows of DOM attributes.
			propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
		},
	},
};
export default config;
