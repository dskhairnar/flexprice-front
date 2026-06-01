import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CreditCard, Landmark, Wallet } from 'lucide-react';
import RadioGroup, { type RadioMenuItem } from './RadioGroup';

const items: RadioMenuItem[] = [
	{ value: 'card', label: 'Card', description: 'Collect payment with card details.', icon: CreditCard },
	{ value: 'bank', label: 'Bank debit', description: 'Use ACH or direct debit.', icon: Landmark },
	{ value: 'wallet', label: 'Wallet balance', description: 'Deduct from prepaid credits.', icon: Wallet },
];

const meta = {
	title: 'Flexprice/Atoms/RadioGroup',
	component: RadioGroup,
	tags: ['autodocs'],
	args: {
		title: 'Collection method',
		items,
	},
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: (args) => {
		const [selected, setSelected] = useState<RadioMenuItem>(items[0]);
		return (
			<div className='w-96'>
				<RadioGroup {...args} selected={selected} onChange={setSelected} />
			</div>
		);
	},
};
