import type { Meta, StoryObj } from '@storybook/react';
import { Plus } from 'lucide-react';
import SectionHeader from './SectionHeader';

const meta = {
	title: 'Flexprice/Atoms/SectionHeader',
	component: SectionHeader,
	tags: ['autodocs'],
	args: {
		title: 'Customers',
		showSearch: true,
		showFilter: true,
		showButton: true,
		buttonText: 'New customer',
		buttonIcon: <Plus className='size-4' />,
	},
} satisfies Meta<typeof SectionHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: (args) => (
		<div className='w-[640px]'>
			<SectionHeader {...args} />
		</div>
	),
};
