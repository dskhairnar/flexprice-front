import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../Button';
import PaymentUrlSuccessDialog from './PaymentUrlSuccessDialog';

const meta = {
	title: 'Flexprice/Atoms/PaymentUrlSuccessDialog',
	component: PaymentUrlSuccessDialog,
	tags: ['autodocs'],
	args: {
		isOpen: false,
		paymentUrl: 'https://pay.flexprice.example/inv_123',
		isCopied: false,
		onClose: () => {},
		onCopyUrl: () => {},
		onGoToLink: () => {},
	},
} satisfies Meta<typeof PaymentUrlSuccessDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: (args) => {
		const [open, setOpen] = useState(false);
		const [copied, setCopied] = useState(false);
		return (
			<>
				<Button onClick={() => setOpen(true)}>Show success dialog</Button>
				<PaymentUrlSuccessDialog
					{...args}
					isOpen={open}
					isCopied={copied}
					onClose={() => setOpen(false)}
					onCopyUrl={() => setCopied(true)}
					onGoToLink={() => setOpen(false)}
				/>
			</>
		);
	},
};
