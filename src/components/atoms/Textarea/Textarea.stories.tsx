import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Textarea from './Textarea';

const meta = {
	title: 'Flexprice/Atoms/Textarea',
	component: Textarea,
	tags: ['autodocs'],
	args: {
		label: 'Internal note',
		placeholder: 'Add notes for the billing team',
		description: 'Visible only to your team.',
	},
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: (args) => {
		const [value, setValue] = useState('Customer prefers invoices on the first business day.');
		return (
			<div className='w-96'>
				<Textarea {...args} value={value} onChange={setValue} />
			</div>
		);
	},
};
