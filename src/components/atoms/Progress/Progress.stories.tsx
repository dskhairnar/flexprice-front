import type { Meta, StoryObj } from '@storybook/react';
import Progress from './Progress';

const meta = {
	title: 'Flexprice/Atoms/Progress',
	component: Progress,
	tags: ['autodocs'],
	argTypes: {
		value: { control: { type: 'number', min: 0, max: 100, step: 1 } },
		label: { control: 'text' },
		indicatorColor: { control: 'text' },
		backgroundColor: { control: 'text' },
		labelColor: { control: 'text' },
	},
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		value: 68,
		label: '68% of included usage consumed',
	},
};

export const States: Story = {
	render: () => (
		<div className='w-[420px] space-y-5'>
			<Progress value={24} label='Low usage' indicatorColor='bg-emerald-600' />
			<Progress value={68} label='Healthy usage' />
			<Progress value={92} label='Approaching limit' indicatorColor='bg-orange-600' />
		</div>
	),
};
