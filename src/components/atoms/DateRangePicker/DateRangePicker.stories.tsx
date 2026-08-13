import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import DateRangePicker from './DateRangePicker';

/**
 * Scaffolded by `npm run storybook:gen`. Edit freely — this file is never regenerated in place
 * unless you pass `--force`.
 *
 * Before you call it done: cover the states that actually break — loading, empty, error, long
 * text, disabled — and check the story in dark mode and in Arabic (toolbar).
 */
const meta: Meta<typeof DateRangePicker> = {
	title: 'Atoms/DateRangePicker',
	component: DateRangePicker,
	args: {
		placeholder: 'Select Range',
		disabled: false,
		title: 'Metered usage',
		onChange: fn(),
	},
	argTypes: {
		placeholder: { control: 'text' },
		disabled: { control: 'boolean' },
		title: { control: 'text' },
		onChange: { action: 'onChange' },
		className: { control: 'text' },
		labelClassName: { control: 'text' },
		popoverClassName: { control: 'text' },
		popoverTriggerClassName: { control: 'text' },
		popoverContentClassName: { control: 'text' },
	},
};

export default meta;
type Story = StoryObj<typeof DateRangePicker>;

export const Default: Story = {};

export const Disabled: Story = {
	args: { disabled: true },
};
