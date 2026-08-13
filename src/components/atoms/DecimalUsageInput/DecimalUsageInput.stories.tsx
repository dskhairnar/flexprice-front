import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import DecimalUsageInput from './DecimalUsageInput';

/**
 * Scaffolded by `npm run storybook:gen`. Edit freely — this file is never regenerated in place
 * unless you pass `--force`.
 *
 * Before you call it done: cover the states that actually break — loading, empty, error, long
 * text, disabled — and check the story in dark mode and in Arabic (toolbar).
 */
const meta: Meta<typeof DecimalUsageInput> = {
	title: 'Atoms/DecimalUsageInput',
	component: DecimalUsageInput,
	args: {
		value: 'sub_01JQ8Z3K4N7P2R9T',
		onChange: fn(),
		precision: 3,
		min: 0,
		max: 0,
		label: 'Monthly minutes',
		placeholder: '0.000',
		disabled: false,
		error: 'This field is required',
		description: 'Charged per 1,000 API calls, billed monthly in arrears.',
		id: 'plan_01JQ8Z3K4N7P2R9T',
	},
	argTypes: {
		value: { control: 'text' },
		onChange: { action: 'onChange' },
		precision: { control: 'number' },
		min: { control: 'number' },
		max: { control: 'number' },
		label: { control: 'text' },
		placeholder: { control: 'text' },
		disabled: { control: 'boolean' },
		error: { control: 'text' },
		description: { control: 'text' },
		suffix: { control: 'text' },
		id: { control: 'text' },
		className: { control: 'text' },
		ariaLabel: { control: 'text', description: 'Passed to the native input when `label` is omitted (accessibility).' },
		inputPrefix: { control: 'text', description: 'Shown before the input (e.g. currency symbol).' },
	},
};

export default meta;
type Story = StoryObj<typeof DecimalUsageInput>;

export const Default: Story = {};

export const Disabled: Story = {
	args: { disabled: true },
};
