import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import Sheet from './Sheet';

/**
 * Scaffolded by `npm run storybook:gen`. Edit freely — this file is never regenerated in place
 * unless you pass `--force`.
 *
 * Before you call it done: cover the states that actually break — loading, empty, error, long
 * text, disabled — and check the story in dark mode and in Arabic (toolbar).
 */
const meta: Meta<typeof Sheet> = {
	title: 'Atoms/Sheet',
	component: Sheet,
	args: {
		children: 'Sample content',
		title: 'Metered usage',
		description: 'Charged per 1,000 API calls, billed monthly in arrears.',
		isOpen: false,
		onOpenChange: fn(),
		size: 'sm',
	},
	argTypes: {
		trigger: { control: 'text' },
		children: { control: 'text' },
		title: { control: 'text' },
		description: { control: 'text' },
		isOpen: { control: 'boolean' },
		onOpenChange: { action: 'onOpenChange' },
		className: { control: 'text' },
		size: { control: 'select', options: ['sm', 'lg', 'md', 'xl', '2xl', '3xl', 'full'] },
	},
};

export default meta;
type Story = StoryObj<typeof Sheet>;

export const Default: Story = {};
