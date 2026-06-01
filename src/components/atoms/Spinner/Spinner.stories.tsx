import type { Meta, StoryObj } from '@storybook/react';
import Spinner from './Spinner';

const meta = {
	title: 'Flexprice/Atoms/Spinner',
	component: Spinner,
	tags: ['autodocs'],
	argTypes: {
		size: { control: { type: 'number', min: 12, max: 64, step: 4 } },
		className: { control: 'text' },
	},
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		size: 24,
		className: 'text-primary',
	},
};

export const Sizes: Story = {
	args: {
		size: 24,
		className: 'text-primary',
	},
	parameters: {
		docs: {
			description: {
				story: 'Use the size and label controls to preview the spinner treatment used in loading states.',
			},
		},
	},
	render: ({ size, className }) => (
		<div className='flex flex-wrap items-center gap-8'>
			<div className='flex items-center gap-3 rounded-[6px] border border-border p-3'>
				<Spinner size={size} className={className} />
				<span className='text-sm text-muted-foreground'>Controlled preview</span>
			</div>
			<div className='flex items-center gap-4 border-l border-border pl-6'>
				<Spinner size={16} className='text-muted-foreground' />
				<Spinner size={24} className='text-primary' />
				<Spinner size={36} className='text-destructive' />
			</div>
		</div>
	),
};
