import type { Meta, StoryObj } from '@storybook/react-vite';
import FieldWithInfo from './FieldWithInfo';

/**
 * Scaffolded by `npm run storybook:gen`. Edit freely — this file is never regenerated in place
 * unless you pass `--force`.
 *
 * Before you call it done: cover the states that actually break — loading, empty, error, long
 * text, disabled — and check the story in dark mode and in Arabic (toolbar).
 */
const meta: Meta<typeof FieldWithInfo> = {
	title: 'Atoms/FieldWithInfo',
	component: FieldWithInfo,
	args: {
		label: 'Monthly minutes',
		description: 'Charged per 1,000 API calls, billed monthly in arrears.',
		infoAriaLabel: 'Sample content',
		disabled: false,
		children: 'Sample content',
	},
	argTypes: {
		label: { control: 'text' },
		description: { control: 'text' },
		infoAriaLabel: { control: 'text' },
		disabled: { control: 'boolean' },
		className: { control: 'text' },
		children: { control: 'text' },
	},
};

export default meta;
type Story = StoryObj<typeof FieldWithInfo>;

export const Default: Story = {};

export const Disabled: Story = {
	args: { disabled: true },
};
