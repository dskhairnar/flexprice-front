import type { Meta, StoryObj } from '@storybook/react-vite';
import ComingSoonTag from './ComingSoon';

/**
 * Scaffolded by `npm run storybook:gen`. Edit freely — this file is never regenerated in place
 * unless you pass `--force`.
 *
 * Before you call it done: cover the states that actually break — loading, empty, error, long
 * text, disabled — and check the story in dark mode and in Arabic (toolbar).
 */
const meta: Meta<typeof ComingSoonTag> = {
	title: 'Atoms/ComingSoon',
	component: ComingSoonTag,
};

export default meta;
type Story = StoryObj<typeof ComingSoonTag>;

export const Default: Story = {};
