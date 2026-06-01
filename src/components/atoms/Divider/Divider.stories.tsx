import type { Meta, StoryObj } from '@storybook/react';
import Divider from './Divider';

const meta = {
	title: 'Flexprice/Atoms/Divider',
	component: Divider,
	tags: ['autodocs'],
	args: {
		width: '70%',
		alignment: 'center',
		color: '#D4D4D8',
	},
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: (args) => (
		<div className='w-96 space-y-3'>
			<p className='text-sm text-muted-foreground'>Section above</p>
			<Divider {...args} />
			<p className='text-sm text-muted-foreground'>Section below</p>
		</div>
	),
};
