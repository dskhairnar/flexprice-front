import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { DateTimePicker as DateTimePicker } from './DateTimePicker';

/**
 * Scaffolded by `npm run storybook:gen`. Edit freely — this file is never regenerated in place
 * unless you pass `--force`.
 *
 * Before you call it done: cover the states that actually break — loading, empty, error, long
 * text, disabled — and check the story in dark mode and in Arabic (toolbar).
 */
const meta: Meta<typeof DateTimePicker> = {
	title: 'Atoms/DateTimePicker',
	component: DateTimePicker,
	args: {
		setDate: fn(),
		placeholder: 'Search…',
		disabled: false,
		title: 'Metered usage',
	},
	argTypes: {
		setDate: { action: 'setDate' },
		placeholder: { control: 'text' },
		disabled: { control: 'boolean' },
		title: { control: 'text' },
	},
};

export default meta;
type Story = StoryObj<typeof DateTimePicker>;

export const Default: Story = {};

export const Disabled: Story = {
	args: { disabled: true },
};
