import type { Meta, StoryObj } from '@storybook/react-vite';
import ShortPagination from './ShortPagination';

/**
 * Scaffolded by `npm run storybook:gen`. Edit freely — this file is never regenerated in place
 * unless you pass `--force`.
 *
 * Before you call it done: cover the states that actually break — loading, empty, error, long
 * text, disabled — and check the story in dark mode and in Arabic (toolbar).
 */
const meta: Meta<typeof ShortPagination> = {
	title: 'Atoms/ShortPagination',
	component: ShortPagination,
	args: {
		totalItems: 0,
		pageSize: 0,
		showPages: false,
	},
	argTypes: {
		totalItems: { control: 'number' },
		pageSize: { control: 'number' },
		showPages: { control: 'boolean' },
		unit: { control: 'text' },
	},
};

export default meta;
type Story = StoryObj<typeof ShortPagination>;

export const Default: Story = {};
