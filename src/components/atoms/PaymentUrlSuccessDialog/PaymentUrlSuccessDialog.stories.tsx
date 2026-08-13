import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import PaymentUrlSuccessDialog from './PaymentUrlSuccessDialog';

/**
 * Scaffolded by `npm run storybook:gen`. Edit freely — this file is never regenerated in place
 * unless you pass `--force`.
 *
 * Before you call it done: cover the states that actually break — loading, empty, error, long
 * text, disabled — and check the story in dark mode and in Arabic (toolbar).
 */
const meta: Meta<typeof PaymentUrlSuccessDialog> = {
	title: 'Atoms/PaymentUrlSuccessDialog',
	component: PaymentUrlSuccessDialog,
	args: {
		isOpen: false,
		paymentUrl: 'Sample content',
		isCopied: false,
		onClose: fn(),
		onCopyUrl: fn(),
		onGoToLink: fn(),
	},
	argTypes: {
		isOpen: { control: 'boolean' },
		paymentUrl: { control: 'text' },
		isCopied: { control: 'boolean' },
		onClose: { action: 'onClose' },
		onCopyUrl: { action: 'onCopyUrl' },
		onGoToLink: { action: 'onGoToLink' },
	},
};

export default meta;
type Story = StoryObj<typeof PaymentUrlSuccessDialog>;

export const Default: Story = {};
