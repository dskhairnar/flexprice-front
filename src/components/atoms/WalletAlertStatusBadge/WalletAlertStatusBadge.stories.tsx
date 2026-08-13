import type { Meta, StoryObj } from '@storybook/react-vite';
import WalletAlertStatusBadge from './WalletAlertStatusBadge';

/**
 * Scaffolded by `npm run storybook:gen`. Edit freely — this file is never regenerated in place
 * unless you pass `--force`.
 *
 * Before you call it done: cover the states that actually break — loading, empty, error, long
 * text, disabled — and check the story in dark mode and in Arabic (toolbar).
 */
const meta: Meta<typeof WalletAlertStatusBadge> = {
	title: 'Atoms/WalletAlertStatusBadge',
	component: WalletAlertStatusBadge,
	args: {
		balance: 0,
	},
	argTypes: {
		balance: { control: 'number' },
		currency: { control: 'text' },
	},
};

export default meta;
type Story = StoryObj<typeof WalletAlertStatusBadge>;

export const Default: Story = {};
