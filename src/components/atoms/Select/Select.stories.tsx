import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import FlexPriceSelect from './Select';

/**
 * Scaffolded by `npm run storybook:gen`. Edit freely — this file is never regenerated in place
 * unless you pass `--force`.
 *
 * Before you call it done: cover the states that actually break — loading, empty, error, long
 * text, disabled — and check the story in dark mode and in Arabic (toolbar).
 */
const meta: Meta<typeof FlexPriceSelect> = {
	title: 'Atoms/Select',
	component: FlexPriceSelect,
	args: {
		options: [],
		value: 'sub_01JQ8Z3K4N7P2R9T',
		defaultOpen: false,
		placeholder: 'Select an option',
		label: '',
		required: false,
		description: 'Charged per 1,000 API calls, billed monthly in arrears.',
		error: 'This field is required',
		onChange: fn(),
		disabled: false,
		isRadio: false,
		hideSelectedTick: true,
	},
	argTypes: {
		options: { control: 'object' },
		value: { control: 'text' },
		defaultOpen: { control: 'boolean' },
		placeholder: { control: 'text' },
		label: { control: 'text' },
		required: { control: 'boolean' },
		description: { control: 'text' },
		error: { control: 'text' },
		onChange: { action: 'onChange' },
		disabled: { control: 'boolean' },
		isRadio: { control: 'boolean' },
		className: { control: 'text' },
		noOptionsText: { control: 'text' },
		hideSelectedTick: { control: 'boolean' },
		trigger: { control: 'text' },
		contentClassName: { control: 'text' },
	},
};

export default meta;
type Story = StoryObj<typeof FlexPriceSelect>;

export const Default: Story = {};

export const Disabled: Story = {
	args: { disabled: true },
};
