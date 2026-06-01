import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../Button';
import Dialog from './Dialog';

const meta = {
	title: 'Flexprice/Atoms/Dialog',
	component: Dialog,
	tags: ['autodocs'],
	args: {
		title: 'Confirm plan change',
		description: 'This change will apply from the next billing cycle.',
		isOpen: false,
		onOpenChange: () => {},
	},
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: (args) => {
		const [open, setOpen] = useState(false);
		return (
			<>
				<Button onClick={() => setOpen(true)}>Open dialog</Button>
				<Dialog {...args} isOpen={open} onOpenChange={setOpen}>
					<div className='flex justify-end gap-2'>
						<Button variant='outline' onClick={() => setOpen(false)}>
							Cancel
						</Button>
						<Button onClick={() => setOpen(false)}>Confirm</Button>
					</div>
				</Dialog>
			</>
		);
	},
};
