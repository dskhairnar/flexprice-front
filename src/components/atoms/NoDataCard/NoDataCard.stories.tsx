import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../Button';
import NoDataCard from './NoDataCard';

const meta = {
	title: 'Flexprice/Atoms/NoDataCard',
	component: NoDataCard,
	tags: ['autodocs'],
	args: {
		title: 'No plans yet',
		subtitle: 'Create your first plan to start charging customers.',
		cta: <Button size='sm'>Create plan</Button>,
	},
} satisfies Meta<typeof NoDataCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
