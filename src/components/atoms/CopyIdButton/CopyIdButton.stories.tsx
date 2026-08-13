import type { Meta, StoryObj } from '@storybook/react-vite';
import { CopyIdButton as CopyIdButton } from './CopyIdButton';

/**
 * Scaffolded by `npm run storybook:gen`. Edit freely — this file is never regenerated in place
 * unless you pass `--force`.
 *
 * Before you call it done: cover the states that actually break — loading, empty, error, long
 * text, disabled — and check the story in dark mode and in Arabic (toolbar).
 */
const meta: Meta<typeof CopyIdButton> = {
	title: 'Atoms/CopyIdButton',
	component: CopyIdButton,
	args: {
		id: 'plan_01JQ8Z3K4N7P2R9T',
		variant: 'default',
		size: 'default',
		asChild: false,
		isLoading: false,
	},
	argTypes: {
		id: { control: 'text', description: 'The ID to copy to clipboard' },
		entityType: {
			control: 'text',
			description: 'The entity type (e.g., "Feature", "Plan", "Customer") used to generate the toast message',
		},
		toastMessage: { control: 'text', description: 'Custom toast message. If provided, takes precedence over entityType' },
		prefixIcon: { control: 'text' },
		variant: { control: 'select', options: ['default', 'black', 'destructive', 'outline', 'secondary', 'ghost', 'link'] },
		size: { control: 'select', options: ['default', 'sm', 'lg', 'icon', 'xs'] },
		asChild: { control: 'boolean' },
		isLoading: { control: 'boolean' },
		suffixIcon: { control: 'text' },
	},
};

export default meta;
type Story = StoryObj<typeof CopyIdButton>;

export const Default: Story = {};
