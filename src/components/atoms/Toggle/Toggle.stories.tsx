import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import Toggle from './Toggle';

/**
 * Scaffolded by `npm run storybook:gen`. Edit freely — this file is never regenerated in place
 * unless you pass `--force`.
 *
 * Before you call it done: cover the states that actually break — loading, empty, error, long
 * text, disabled — and check the story in dark mode and in Arabic (toolbar).
 */
const meta: Meta<typeof Toggle> = {
	title: 'Atoms/Toggle',
	component: Toggle,
	args: {
		onChange: fn(),
		checked: false,
		title: 'Metered usage',
		label: 'Monthly minutes',
		description: 'Charged per 1,000 API calls, billed monthly in arrears.',
		error: 'This field is required',
		disabled: false,
	},
	argTypes: {
		onChange: { action: 'onChange' },
		checked: { control: 'boolean' },
		title: { control: 'text' },
		label: { control: 'text' },
		description: { control: 'text' },
		error: { control: 'text' },
		disabled: { control: 'boolean' },
		className: { control: 'text' },
	},
};

export default meta;
type Story = StoryObj<typeof Toggle>;

export const Default: Story = {};

export const Disabled: Story = {
	args: { disabled: true },
};
