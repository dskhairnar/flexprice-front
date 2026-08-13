import type { Meta, StoryObj } from '@storybook/react-vite';
import Spacer from './Spacer';

/**
 * Scaffolded by `npm run storybook:gen`. Edit freely — this file is never regenerated in place
 * unless you pass `--force`.
 *
 * Before you call it done: cover the states that actually break — loading, empty, error, long
 * text, disabled — and check the story in dark mode and in Arabic (toolbar).
 */
const meta: Meta<typeof Spacer> = {
	title: 'Atoms/Spacer',
	component: Spacer,
	argTypes: {
		className: { control: 'text' },
	},
};

export default meta;
type Story = StoryObj<typeof Spacer>;

export const Default: Story = {};
