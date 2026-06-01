import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../Button';
import Card, { CardHeader } from '../Card';
import Modal from './Modal';

const meta = {
	title: 'Flexprice/Atoms/Modal',
	component: Modal,
	tags: ['autodocs'],
	args: {
		isOpen: false,
		onOpenChange: () => {},
		showOverlay: true,
		className: 'w-[420px]',
	},
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: (args) => {
		const [open, setOpen] = useState(false);

		useEffect(() => {
			let root = document.getElementById('modal-root');
			if (!root) {
				root = document.createElement('div');
				root.id = 'modal-root';
				document.body.appendChild(root);
			}
		}, []);

		return (
			<>
				<Button onClick={() => setOpen(true)}>Open modal</Button>
				<Modal {...args} isOpen={open} onOpenChange={setOpen}>
					<Card className='bg-white p-6'>
						<CardHeader title='Payment collected' subtitle='The invoice was marked as paid.' />
					</Card>
				</Modal>
			</>
		);
	},
};
