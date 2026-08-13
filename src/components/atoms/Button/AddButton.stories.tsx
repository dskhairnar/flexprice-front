import type { Meta, StoryObj } from '@storybook/react-vite';
import AddButton from './AddButton';

/**
 * Scaffolded by `npm run storybook:gen`. Edit freely — this file is never regenerated in place
 * unless you pass `--force`.
 *
 * Before you call it done: cover the states that actually break — loading, empty, error, long
 * text, disabled — and check the story in dark mode and in Arabic (toolbar).
 */
const meta: Meta<typeof AddButton> = {
	title: 'Atoms/Button/AddButton',
	component: AddButton,
	args: {
		label: 'Monthly minutes',
		variant: 'default',
		size: 'default',
		asChild: false,
		isLoading: false,
	},
	argTypes: {
		label: { control: 'text', description: "Custom label text. Defaults to t('actions.add')" },
		variant: { control: 'select', options: ['default', 'black', 'destructive', 'outline', 'secondary', 'ghost', 'link'] },
		size: { control: 'select', options: ['default', 'sm', 'lg', 'icon', 'xs'] },
		asChild: { control: 'boolean' },
		isLoading: { control: 'boolean' },
		suffixIcon: { control: 'text' },
	},
};

export default meta;
type Story = StoryObj<typeof AddButton>;

export const Default: Story = {};
