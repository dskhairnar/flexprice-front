import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import DateTimePicker from './DateTimePicker';

const meta = {
	title: 'Flexprice/Atoms/DateTimePicker',
	component: DateTimePicker,
	tags: ['autodocs'],
	args: {
		title: 'Activation time',
		placeholder: 'Choose date and time',
		date: new Date(2026, 4, 31, 10, 30),
		setDate: () => {},
	},
} satisfies Meta<typeof DateTimePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: (args) => {
		const [date, setDate] = useState<Date | undefined>(new Date(2026, 4, 31, 10, 30));
		return (
			<div className='w-80'>
				<DateTimePicker {...args} date={date} setDate={setDate} />
			</div>
		);
	},
};
