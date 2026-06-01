import type { Meta, StoryObj } from '@storybook/react';
import ComingSoonTag from './ComingSoon';

const meta = {
	title: 'Flexprice/Atoms/ComingSoon',
	component: ComingSoonTag,
	tags: ['autodocs'],
} satisfies Meta<typeof ComingSoonTag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
