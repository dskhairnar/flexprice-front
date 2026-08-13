import type { Meta, StoryObj } from '@storybook/react-vite';
import Button from './Button';

/**
 * Scaffolded by `npm run storybook:gen`. Edit freely — this file is never regenerated in place
 * unless you pass `--force`.
 *
 * Before you call it done: cover the states that actually break — loading, empty, error, long
 * text, disabled — and check the story in dark mode and in Arabic (toolbar).
 */
const meta: Meta<typeof Button> = {
	title: 'Atoms/Button',
	component: Button,
	args: {
		asChild: false,
		isLoading: false,
		variant: 'default',
		size: 'default',
	},
	argTypes: {
		asChild: { control: 'boolean' },
		isLoading: { control: 'boolean' },
		suffixIcon: { control: 'text' },
		prefixIcon: { control: 'text' },
		variant: { control: 'select', options: ['default', 'black', 'destructive', 'outline', 'secondary', 'ghost', 'link'] },
		size: { control: 'select', options: ['default', 'sm', 'lg', 'icon', 'xs'] },
	},
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {};
