import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../Button';
import Sheet from './Sheet';

const meta = {
	title: 'Flexprice/Atoms/Sheet',
	component: Sheet,
	tags: ['autodocs'],
	args: {
		title: 'Invoice settings',
		description: 'Review collection and reminder settings.',
		size: 'md',
	},
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: (args) => {
		const [open, setOpen] = useState(false);
		return (
			<>
				<Button onClick={() => setOpen(true)}>Open sheet</Button>
				<Sheet {...args} isOpen={open} onOpenChange={setOpen}>
					<div className='mt-4 space-y-4 text-sm text-muted-foreground'>
						<p>Send invoices automatically when a billing period closes.</p>
						<p>Notify customers before retrying failed payments.</p>
					</div>
				</Sheet>
			</>
		);
	},
};
