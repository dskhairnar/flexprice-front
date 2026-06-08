import type { Meta, StoryObj } from '@storybook/react';
import ToastNotification, { showToast } from './ToastNotification';
import { withAppToaster } from './toastStoryDecorator';

const meta = {
	title: 'Flexprice/Atoms/ToastNotification',
	component: ToastNotification,
	tags: ['autodocs'],
	decorators: [withAppToaster],
	argTypes: {
		message: { control: 'text' },
		variant: { control: 'select', options: ['error', 'success'] },
		triggerLabel: { control: 'text' },
	},
	args: {
		message: 'Subscription created successfully',
		variant: 'success',
		triggerLabel: 'Show toast',
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<typeof ToastNotification>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const OnLoad: Story = {
	play: async ({ args }) => {
		await new Promise((resolve) => setTimeout(resolve, 300));
		showToast(args.message, args.variant ?? 'error');
	},
};
