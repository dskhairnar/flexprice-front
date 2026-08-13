import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import Chip from './Chip';

/**
 * Scaffolded by `npm run storybook:gen`. Edit freely — this file is never regenerated in place
 * unless you pass `--force`.
 *
 * Before you call it done: cover the states that actually break — loading, empty, error, long
 * text, disabled — and check the story in dark mode and in Arabic (toolbar).
 */
const meta: Meta<typeof Chip> = {
	title: 'Atoms/Chip',
	component: Chip,
	args: {
		label: 'Monthly minutes',
		variant: 'default',
		onClick: fn(),
		disabled: false,
	},
	argTypes: {
		label: { control: 'text', description: 'The main content of the chip' },
		variant: {
			control: 'select',
			options: ['default', 'warning', 'success', 'failed', 'info'],
			description: 'Visual style variant of the chip',
		},
		textColor: { control: 'text', description: 'Custom text color (overrides variant)' },
		bgColor: { control: 'text', description: 'Custom background color (overrides variant)' },
		onClick: { action: 'onClick', description: 'Click handler for the chip' },
		icon: { control: 'text', description: 'Icon to display before the label' },
		childrenAfter: { control: 'text', description: 'Additional content to display after the label' },
		className: { control: 'text', description: 'Additional CSS classes' },
		disabled: { control: 'boolean', description: 'Whether the chip is disabled' },
		borderColor: { control: 'text' },
	},
};

export default meta;
type Story = StoryObj<typeof Chip>;

export const Default: Story = {};

export const Disabled: Story = {
	args: { disabled: true },
};
