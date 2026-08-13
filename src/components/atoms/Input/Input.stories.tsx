import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import Input from './Input';

/**
 * Scaffolded by `npm run storybook:gen`. Edit freely — this file is never regenerated in place
 * unless you pass `--force`.
 *
 * Before you call it done: cover the states that actually break — loading, empty, error, long
 * text, disabled — and check the story in dark mode and in Arabic (toolbar).
 */
const meta: Meta<typeof Input> = {
	title: 'Atoms/Input',
	component: Input,
	args: {
		label: 'Monthly minutes',
		description: 'Charged per 1,000 API calls, billed monthly in arrears.',
		error: 'This field is required',
		onChange: fn(),
		disabled: false,
		placeholder: 'Search…',
		id: 'plan_01JQ8Z3K4N7P2R9T',
		variant: 'text',
		size: 'default',
		englishOnly: true,
	},
	argTypes: {
		label: { control: 'text' },
		description: { control: 'text' },
		error: { control: 'text' },
		onChange: { action: 'onChange' },
		disabled: { control: 'boolean' },
		suffix: { control: 'text' },
		className: { control: 'text' },
		placeholder: { control: 'text' },
		id: { control: 'text' },
		inputPrefix: { control: 'text' },
		labelClassName: { control: 'text' },
		variant: { control: 'select', options: ['number', 'text', 'formatted-number', 'integer'] },
		size: { control: 'select', options: ['default', 'xs', 'sm', 'lg', 'icon'] },
		englishOnly: {
			control: 'boolean',
			description:
				'Restrict to printable ASCII and Basic Arabic. Defaults to true for `variant="text"`; set `englishOnly={false}` to allow other scripts.',
		},
	},
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {};

export const Disabled: Story = {
	args: { disabled: true },
};
