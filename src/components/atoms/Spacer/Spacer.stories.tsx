import type { Meta, StoryObj } from '@storybook/react';
import Spacer from './Spacer';

const meta = {
	title: 'Flexprice/Atoms/Spacer',
	component: Spacer,
	tags: ['autodocs'],
	args: {
		height: 32,
		width: '100%',
		className: 'bg-muted',
	},
} satisfies Meta<typeof Spacer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: (args) => (
		<div className='w-72 rounded-md border p-4 text-sm'>
			<div>Above spacer</div>
			<Spacer {...args} />
			<div>Below spacer</div>
		</div>
	),
};
