import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Combobox from './Combobox';

const options = [
	{ value: 'monthly', label: 'Monthly' },
	{ value: 'quarterly', label: 'Quarterly' },
	{ value: 'yearly', label: 'Yearly' },
];

const meta = {
	title: 'Flexprice/Atoms/Combobox',
	component: Combobox,
	tags: ['autodocs'],
	args: {
		options,
		placeholder: 'Select billing cycle',
		searchPlaceholder: 'Search cycles',
		width: 260,
	},
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: (args) => {
		const [value, setValue] = useState('monthly');
		return <Combobox {...args} value={value} onChange={setValue} />;
	},
};
