import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { ShortPaginationControls as ShortPaginationControls } from './ShortPaginationControls';

/**
 * Scaffolded by `npm run storybook:gen`. Edit freely — this file is never regenerated in place
 * unless you pass `--force`.
 *
 * Before you call it done: cover the states that actually break — loading, empty, error, long
 * text, disabled — and check the story in dark mode and in Arabic (toolbar).
 */
const meta: Meta<typeof ShortPaginationControls> = {
	title: 'Atoms/ShortPagination/ShortPaginationControls',
	component: ShortPaginationControls,
	args: {
		page: 0,
		onPageChange: fn(),
		totalItems: 0,
		pageSize: 0,
		showPages: false,
	},
	argTypes: {
		page: { control: 'number' },
		onPageChange: { action: 'onPageChange' },
		totalItems: { control: 'number' },
		pageSize: { control: 'number' },
		unit: { control: 'text' },
		showPages: { control: 'boolean' },
	},
};

export default meta;
type Story = StoryObj<typeof ShortPaginationControls>;

export const Default: Story = {};
