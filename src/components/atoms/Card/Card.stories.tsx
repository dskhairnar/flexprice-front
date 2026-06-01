import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../Button';
import Card, { CardHeader } from './Card';

const meta = {
	title: 'Flexprice/Atoms/Card',
	component: Card,
	tags: ['autodocs'],
	argTypes: {
		variant: { control: 'select', options: ['default', 'notched', 'bordered', 'elevated', 'warning'] },
		notchPosition: { control: 'select', options: ['left', 'right'] },
		notchSize: { control: 'select', options: ['sm', 'md', 'lg'] },
		noPadding: { control: 'boolean' },
		children: { table: { disable: true } },
	},
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		variant: 'default',
		children: (
			<>
				<CardHeader title='Starter plan' subtitle='Basic metered billing setup' cta={<Button variant='outline'>Edit</Button>} />
				<p className='text-sm text-muted-foreground'>Includes one usage metric, monthly invoices, and hosted payment links.</p>
			</>
		),
	},
};

export const Variants: Story = {
	render: () => (
		<div className='grid max-w-4xl gap-4 md:grid-cols-2'>
			<Card>
				<CardHeader title='Default' subtitle='Standard bordered card' />
			</Card>
			<Card variant='notched' notchColor='primary'>
				<CardHeader title='Notched' subtitle='Highlights selected or important content' />
			</Card>
			<Card variant='elevated'>
				<CardHeader title='Elevated' subtitle='Uses shadow for raised emphasis' />
			</Card>
			<Card variant='warning'>
				<CardHeader title='Warning' subtitle='Reserved for destructive or risky states' />
			</Card>
		</div>
	),
};
