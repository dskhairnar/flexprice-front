import type { Meta, StoryObj } from '@storybook/react-vite';
import Page from './Page';

/**
 * Scaffolded by `npm run storybook:gen`. Edit freely — this file is never regenerated in place
 * unless you pass `--force`.
 *
 * Before you call it done: cover the states that actually break — loading, empty, error, long
 * text, disabled — and check the story in dark mode and in Arabic (toolbar).
 */
const meta: Meta<typeof Page> = {
	title: 'Atoms/Page',
	component: Page,
	args: {
		children: 'Sample content',
		type: 'default',
		heading: 'Metered usage',
	},
	argTypes: {
		children: { control: 'text' },
		className: { control: 'text' },
		type: { control: 'select', options: ['default', 'left-aligned'] },
		header: { control: 'text' },
		heading: { control: 'text' },
		headingClassName: { control: 'text' },
		headingCTA: { control: 'text' },
		documentTitle: { control: 'text' },
	},
};

export default meta;
type Story = StoryObj<typeof Page>;

export const Default: Story = {};
