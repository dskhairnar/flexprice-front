import type { Meta, StoryObj } from '@storybook/react';
import Label from './Label';

const meta = {
	title: 'Flexprice/Atoms/Label',
	component: Label,
	tags: ['autodocs'],
	args: {
		label: 'Customer email',
		htmlFor: 'customer-email',
	},
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: (args) => (
		<div className='space-y-1'>
			<Label {...args} />
			<input id='customer-email' className='h-10 w-72 rounded-md border px-3 text-sm' placeholder='customer@example.com' />
		</div>
	),
};
