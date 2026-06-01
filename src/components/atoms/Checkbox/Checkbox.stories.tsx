import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import Checkbox from './Checkbox';

const meta = {
	title: 'Flexprice/Atoms/Checkbox',
	component: Checkbox,
	tags: ['autodocs'],
	argTypes: {
		checked: { control: 'boolean' },
		label: { control: 'text' },
		description: { control: 'text' },
		onCheckedChange: { table: { disable: true } },
	},
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		checked: true,
		label: 'Send invoice email',
		description: 'Notify the customer when the invoice is finalized.',
	},
	render: function Controlled(args) {
		const [checked, setChecked] = useState(Boolean(args.checked));
		return <Checkbox {...args} checked={checked} onCheckedChange={setChecked} id='invoice-email' />;
	},
};

export const WithoutDescription: Story = {
	args: {
		checked: false,
		label: 'Auto collect payment',
	},
	render: function Controlled(args) {
		const [checked, setChecked] = useState(Boolean(args.checked));
		return <Checkbox {...args} checked={checked} onCheckedChange={setChecked} id='auto-collect' />;
	},
};
