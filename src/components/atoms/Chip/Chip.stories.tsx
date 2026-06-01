import type { Meta, StoryObj } from '@storybook/react';
import { CheckCircle2, X } from 'lucide-react';
import Chip from './Chip';

const meta = {
	title: 'Flexprice/Atoms/Chip',
	component: Chip,
	tags: ['autodocs'],
	argTypes: {
		variant: { control: 'select', options: ['default', 'success', 'warning', 'failed', 'info'] },
		label: { control: 'text' },
		disabled: { control: 'boolean' },
		icon: { table: { disable: true } },
		childrenAfter: { table: { disable: true } },
		onClick: { table: { disable: true } },
	},
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		label: 'Active',
		variant: 'success',
	},
};

export const Variants: Story = {
	render: () => (
		<div className='flex flex-wrap gap-3'>
			<Chip label='Draft' variant='default' />
			<Chip label='Active' variant='success' icon={<CheckCircle2 className='size-4' />} />
			<Chip label='Trial' variant='info' />
			<Chip label='Past due' variant='warning' />
			<Chip label='Canceled' variant='failed' childrenAfter={<X className='size-3' />} />
		</div>
	),
};
