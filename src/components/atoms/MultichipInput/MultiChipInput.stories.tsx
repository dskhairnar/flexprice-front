import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import MultichipField from './MultiChipInput';

/**
 * Scaffolded by `npm run storybook:gen`. Edit freely — this file is never regenerated in place
 * unless you pass `--force`.
 *
 * Before you call it done: cover the states that actually break — loading, empty, error, long
 * text, disabled — and check the story in dark mode and in Arabic (toolbar).
 */
const meta: Meta<typeof MultichipField> = {
	title: 'Atoms/MultichipInput/MultiChipInput',
	component: MultichipField,
	args: {
		label: 'Monthly minutes',
		description: 'Charged per 1,000 API calls, billed monthly in arrears.',
		error: 'This field is required',
		placeholder: 'Search…',
		onChange: fn(),
		disabled: false,
		value: [],
	},
	argTypes: {
		label: { control: 'text' },
		description: { control: 'text' },
		error: { control: 'text' },
		placeholder: { control: 'text' },
		onChange: { action: 'onChange' },
		disabled: { control: 'boolean' },
		value: { control: 'object' },
	},
};

export default meta;
type Story = StoryObj<typeof MultichipField>;

export const Default: Story = {};

export const Disabled: Story = {
	args: { disabled: true },
};
