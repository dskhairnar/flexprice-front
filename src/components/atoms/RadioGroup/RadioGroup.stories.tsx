import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import RadioGroup from './RadioGroup';

/**
 * Scaffolded by `npm run storybook:gen`. Edit freely — this file is never regenerated in place
 * unless you pass `--force`.
 *
 * Before you call it done: cover the states that actually break — loading, empty, error, long
 * text, disabled — and check the story in dark mode and in Arabic (toolbar).
 */
const meta: Meta<typeof RadioGroup> = {
	title: 'Atoms/RadioGroup',
	component: RadioGroup,
	args: {
		title: 'Metered usage',
		items: [],
		disabled: false,
		onChange: fn(),
	},
	argTypes: {
		title: { control: 'text' },
		items: { control: 'object' },
		disabled: { control: 'boolean' },
		onChange: { action: 'onChange' },
	},
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

export const Default: Story = {};

export const Disabled: Story = {
	args: { disabled: true },
};
