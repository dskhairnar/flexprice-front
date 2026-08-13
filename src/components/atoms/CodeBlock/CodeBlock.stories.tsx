import type { Meta, StoryObj } from '@storybook/react-vite';
import CodeBlock from './CodeBlock';

/**
 * Scaffolded by `npm run storybook:gen`. Edit freely — this file is never regenerated in place
 * unless you pass `--force`.
 *
 * Before you call it done: cover the states that actually break — loading, empty, error, long
 * text, disabled — and check the story in dark mode and in Arabic (toolbar).
 */
const meta: Meta<typeof CodeBlock> = {
	title: 'Atoms/CodeBlock',
	component: CodeBlock,
	args: {
		code: 'Sample content',
		language: 'Sample content',
	},
	argTypes: {
		code: { control: 'text' },
		language: { control: 'text' },
		className: { control: 'text' },
	},
};

export default meta;
type Story = StoryObj<typeof CodeBlock>;

export const Default: Story = {};
