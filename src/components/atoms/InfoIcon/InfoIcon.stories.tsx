import type { Meta, StoryObj } from '@storybook/react-vite';
import InfoIcon from './InfoIcon';

/**
 * Scaffolded by `npm run storybook:gen`. Edit freely — this file is never regenerated in place
 * unless you pass `--force`.
 *
 * Before you call it done: cover the states that actually break — loading, empty, error, long
 * text, disabled — and check the story in dark mode and in Arabic (toolbar).
 */
const meta: Meta<typeof InfoIcon> = {
	title: 'Atoms/InfoIcon',
	component: InfoIcon,
	args: {
		description: 'Charged per 1,000 API calls, billed monthly in arrears.',
		ariaLabel: 'Sample content',
		disabled: false,
	},
	argTypes: {
		description: { control: 'text' },
		ariaLabel: { control: 'text' },
		disabled: { control: 'boolean' },
		className: { control: 'text' },
	},
};

export default meta;
type Story = StoryObj<typeof InfoIcon>;

export const Default: Story = {};

export const Disabled: Story = {
	args: { disabled: true },
};
