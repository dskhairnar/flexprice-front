import type { Meta, StoryObj } from '@storybook/react-vite';
import Label from './Label';

/**
 * Scaffolded by `npm run storybook:gen`. Edit freely — this file is never regenerated in place
 * unless you pass `--force`.
 *
 * Before you call it done: cover the states that actually break — loading, empty, error, long
 * text, disabled — and check the story in dark mode and in Arabic (toolbar).
 */
const meta: Meta<typeof Label> = {
	title: 'Atoms/Label',
	component: Label,
	args: {
		label: 'Monthly minutes',
		disabled: false,
		children: 'Sample content',
	},
	argTypes: {
		label: { control: 'text' },
		disabled: { control: 'boolean' },
		labelClassName: { control: 'text' },
		children: { control: 'text' },
	},
};

export default meta;
type Story = StoryObj<typeof Label>;

export const Default: Story = {};

export const Disabled: Story = {
	args: { disabled: true },
};
