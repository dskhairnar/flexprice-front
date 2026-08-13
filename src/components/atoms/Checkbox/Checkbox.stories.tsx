import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import Checkbox from './Checkbox';

/**
 * Scaffolded by `npm run storybook:gen`. Edit freely — this file is never regenerated in place
 * unless you pass `--force`.
 *
 * Before you call it done: cover the states that actually break — loading, empty, error, long
 * text, disabled — and check the story in dark mode and in Arabic (toolbar).
 */
const meta: Meta<typeof Checkbox> = {
	title: 'Atoms/Checkbox',
	component: Checkbox,
	args: {
		id: 'plan_01JQ8Z3K4N7P2R9T',
		checked: false,
		onCheckedChange: fn(),
		label: 'Monthly minutes',
		description: 'Charged per 1,000 API calls, billed monthly in arrears.',
		disabled: false,
	},
	argTypes: {
		id: { control: 'text' },
		checked: { control: 'boolean' },
		onCheckedChange: { action: 'onCheckedChange' },
		label: { control: 'text' },
		description: { control: 'text' },
		disabled: { control: 'boolean' },
	},
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {};

export const Disabled: Story = {
	args: { disabled: true },
};
