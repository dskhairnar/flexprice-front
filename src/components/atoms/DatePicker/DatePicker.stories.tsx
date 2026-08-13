import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import DatePicker from './DatePicker';

/**
 * Scaffolded by `npm run storybook:gen`. Edit freely — this file is never regenerated in place
 * unless you pass `--force`.
 *
 * Before you call it done: cover the states that actually break — loading, empty, error, long
 * text, disabled — and check the story in dark mode and in Arabic (toolbar).
 */
const meta: Meta<typeof DatePicker> = {
	title: 'Atoms/DatePicker',
	component: DatePicker,
	args: {
		// TODO: date is required (Date | undefined) — supply a realistic fixture.
		setDate: fn(),
		placeholder: 'Pick a date',
		disabled: false,
		label: 'Monthly minutes',
		clearable: false,
	},
	argTypes: {
		setDate: { action: 'setDate' },
		placeholder: { control: 'text' },
		disabled: { control: 'boolean' },
		label: { control: 'text' },
		clearable: {
			control: 'boolean',
			description: 'Shows a clear (X) button on the trigger once a date is picked, resetting it to `undefined`.',
		},
		className: { control: 'text' },
		labelClassName: { control: 'text' },
		popoverClassName: { control: 'text' },
		popoverTriggerClassName: { control: 'text' },
		popoverContentClassName: { control: 'text' },
		triggerClassName: { control: 'text' },
	},
};

export default meta;
type Story = StoryObj<typeof DatePicker>;

export const Default: Story = {};

export const Disabled: Story = {
	args: { disabled: true },
};
