import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import DatePicker from './DatePicker';

const meta = {
	title: 'Flexprice/Atoms/DatePicker',
	component: DatePicker,
	tags: ['autodocs'],
	args: {
		label: 'Start date',
		placeholder: 'Pick a start date',
		date: new Date(2026, 4, 31),
		setDate: () => {},
	},
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: (args) => {
		const [date, setDate] = useState<Date | undefined>(new Date(2026, 4, 31));
		return (
			<div className='w-72'>
				<DatePicker {...args} date={date} setDate={setDate} />
			</div>
		);
	},
};
