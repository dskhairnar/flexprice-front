import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import Textarea from './Textarea';

/**
 * Scaffolded by `npm run storybook:gen`. Edit freely — this file is never regenerated in place
 * unless you pass `--force`.
 *
 * Before you call it done: cover the states that actually break — loading, empty, error, long
 * text, disabled — and check the story in dark mode and in Arabic (toolbar).
 */
const meta: Meta<typeof Textarea> = {
	title: 'Atoms/Textarea',
	component: Textarea,
	args: {
		label: 'Monthly minutes',
		description: 'Charged per 1,000 API calls, billed monthly in arrears.',
		error: 'This field is required',
		onChange: fn(),
		disabled: false,
		placeholder: 'Search…',
		id: 'plan_01JQ8Z3K4N7P2R9T',
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
		textAreaClassName: { control: 'text' },
		id: { control: 'text' },
	},
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {};

export const Disabled: Story = {
	args: { disabled: true },
};
