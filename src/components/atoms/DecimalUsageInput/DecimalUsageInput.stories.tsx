import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import DecimalUsageInput from './DecimalUsageInput';

const meta = {
	title: 'Flexprice/Atoms/DecimalUsageInput',
	component: DecimalUsageInput,
	tags: ['autodocs'],
	args: {
		label: 'Usage quantity',
		description: 'Accepts up to three decimal places.',
		value: '12.500',
		onChange: () => {},
		suffix: 'GB',
		precision: 3,
		min: 0,
		max: 999,
	},
} satisfies Meta<typeof DecimalUsageInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: (args) => {
		const [value, setValue] = useState('12.500');
		return (
			<div className='w-80'>
				<DecimalUsageInput {...args} value={value} onChange={setValue} />
			</div>
		);
	},
};
