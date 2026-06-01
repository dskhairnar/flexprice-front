import type { Meta, StoryObj } from '@storybook/react';
import { CopyIdButton } from './CopyIdButton';

const meta = {
	title: 'Flexprice/Atoms/CopyIdButton',
	component: CopyIdButton,
	tags: ['autodocs'],
	args: {
		id: 'cus_7YB2K9M4',
		entityType: 'Customer',
	},
} satisfies Meta<typeof CopyIdButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
