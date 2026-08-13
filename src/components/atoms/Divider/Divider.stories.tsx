import type { Meta, StoryObj } from '@storybook/react-vite';
import Divider from './Divider';

/**
 * Scaffolded by `npm run storybook:gen`. Edit freely — this file is never regenerated in place
 * unless you pass `--force`.
 *
 * Before you call it done: cover the states that actually break — loading, empty, error, long
 * text, disabled — and check the story in dark mode and in Arabic (toolbar).
 */
const meta: Meta<typeof Divider> = {
	title: 'Atoms/Divider',
	component: Divider,
	args: {
		color: 'rgb(var(--fp-line-zinc))',
		width: '100%',
		alignment: 'center',
	},
	argTypes: {
		color: { control: 'text' },
		width: { control: 'text' },
		alignment: { control: 'select', options: ['left', 'right', 'center'] },
		className: { control: 'text' },
	},
};

export default meta;
type Story = StoryObj<typeof Divider>;

export const Default: Story = {};
