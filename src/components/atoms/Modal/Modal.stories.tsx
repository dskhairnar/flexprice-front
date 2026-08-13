import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import Modal from './Modal';

/**
 * Scaffolded by `npm run storybook:gen`. Edit freely — this file is never regenerated in place
 * unless you pass `--force`.
 *
 * Before you call it done: cover the states that actually break — loading, empty, error, long
 * text, disabled — and check the story in dark mode and in Arabic (toolbar).
 */
const meta: Meta<typeof Modal> = {
	title: 'Atoms/Modal',
	component: Modal,
	args: {
		isOpen: false,
		onOpenChange: fn(),
		children: 'Sample content',
		showOverlay: true,
	},
	argTypes: {
		isOpen: { control: 'boolean' },
		onOpenChange: { action: 'onOpenChange' },
		children: { control: 'text' },
		className: { control: 'text' },
		showOverlay: { control: 'boolean' },
	},
};

export default meta;
type Story = StoryObj<typeof Modal>;

export const Default: Story = {};
