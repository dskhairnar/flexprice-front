import type { Meta, StoryObj } from '@storybook/react-vite';
import Progress from './Progress';

/**
 * Scaffolded by `npm run storybook:gen`. Edit freely — this file is never regenerated in place
 * unless you pass `--force`.
 *
 * Before you call it done: cover the states that actually break — loading, empty, error, long
 * text, disabled — and check the story in dark mode and in Arabic (toolbar).
 */
const meta: Meta<typeof Progress> = {
	title: 'Atoms/Progress',
	component: Progress,
	args: {
		label: 'Monthly minutes',
	},
	argTypes: {
		indicatorColor: { control: 'text' },
		backgroundColor: { control: 'text' },
		label: { control: 'text' },
		labelColor: { control: 'text' },
		className: { control: 'text' },
	},
};

export default meta;
type Story = StoryObj<typeof Progress>;

export const Default: Story = {};
