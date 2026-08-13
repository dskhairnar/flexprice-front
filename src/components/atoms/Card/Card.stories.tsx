import type { Meta, StoryObj } from '@storybook/react-vite';
import Card from './Card';

/**
 * Scaffolded by `npm run storybook:gen`. Edit freely — this file is never regenerated in place
 * unless you pass `--force`.
 *
 * Before you call it done: cover the states that actually break — loading, empty, error, long
 * text, disabled — and check the story in dark mode and in Arabic (toolbar).
 */
const meta: Meta<typeof Card> = {
	title: 'Atoms/Card',
	component: Card,
	args: {
		variant: 'default',
		notchColor: 'zinc',
		notchPosition: 'left',
		notchSize: 'md',
		noPadding: false,
		children: 'Sample content',
	},
	argTypes: {
		variant: { control: 'select', options: ['default', 'notched', 'bordered', 'elevated', 'warning'] },
		notchColor: { control: 'text' },
		notchPosition: { control: 'select', options: ['left', 'right'] },
		notchSize: { control: 'select', options: ['sm', 'lg', 'md'] },
		noPadding: { control: 'boolean' },
		children: { control: 'text' },
	},
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {};
