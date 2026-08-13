import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { ErrorBoundary as ErrorBoundary } from './ErrorBoundary';

/**
 * Scaffolded by `npm run storybook:gen`. Edit freely — this file is never regenerated in place
 * unless you pass `--force`.
 *
 * Before you call it done: cover the states that actually break — loading, empty, error, long
 * text, disabled — and check the story in dark mode and in Arabic (toolbar).
 */
const meta: Meta<typeof ErrorBoundary> = {
	title: 'Atoms/ErrorBoundary',
	component: ErrorBoundary,
	args: {
		children: 'Sample content',
		onError: fn(),
		name: 'unnamed',
	},
	argTypes: {
		children: { control: 'text' },
		fallback: { control: 'text' },
		onError: { action: 'onError' },
		name: { control: 'text' },
	},
};

export default meta;
type Story = StoryObj<typeof ErrorBoundary>;

export const Default: Story = {};
