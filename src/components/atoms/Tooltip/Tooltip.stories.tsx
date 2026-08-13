import type { Meta, StoryObj } from '@storybook/react-vite';
import Tooltip from './Tooltip';

/**
 * Scaffolded by `npm run storybook:gen`. Edit freely — this file is never regenerated in place
 * unless you pass `--force`.
 *
 * Before you call it done: cover the states that actually break — loading, empty, error, long
 * text, disabled — and check the story in dark mode and in Arabic (toolbar).
 */
const meta: Meta<typeof Tooltip> = {
	title: 'Atoms/Tooltip',
	component: Tooltip,
	args: {
		children: 'Sample content',
		content: 'Sample content',
		delayDuration: 0,
		side: 'top',
		align: 'center',
		sideOffset: 4,
	},
	argTypes: {
		children: { control: 'text', description: 'The element that triggers the tooltip' },
		content: { control: 'text', description: 'The content to display in the tooltip' },
		delayDuration: { control: 'number', description: 'Delay before showing tooltip in ms' },
		side: { control: 'select', options: ['left', 'right', 'top', 'bottom'], description: 'Side of the trigger to show tooltip' },
		align: { control: 'select', options: ['center', 'start', 'end'], description: 'Alignment of the tooltip' },
		sideOffset: { control: 'number', description: 'Offset from the trigger' },
		className: { control: 'text', description: 'Custom className for the tooltip content' },
	},
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {};
