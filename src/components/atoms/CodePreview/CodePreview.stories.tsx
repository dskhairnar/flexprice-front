import type { Meta, StoryObj } from '@storybook/react-vite';
import CodePreview from './CodePreview';

/**
 * Scaffolded by `npm run storybook:gen`. Edit freely — this file is never regenerated in place
 * unless you pass `--force`.
 *
 * Before you call it done: cover the states that actually break — loading, empty, error, long
 * text, disabled — and check the story in dark mode and in Arabic (toolbar).
 */
const meta: Meta<typeof CodePreview> = {
	title: 'Atoms/CodePreview',
	component: CodePreview,
	args: {
		code: 'Sample content',
		title: 'Metered usage',
	},
	argTypes: {
		code: { control: 'text' },
		language: { control: 'text' },
		title: { control: 'text' },
		className: { control: 'text' },
	},
};

export default meta;
type Story = StoryObj<typeof CodePreview>;

export const Default: Story = {};
