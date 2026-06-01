import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import DateRangePicker from './DateRangePicker';

const meta = {
	title: 'Flexprice/Atoms/DateRangePicker',
	component: DateRangePicker,
	tags: ['autodocs'],
	args: {
		title: 'Billing period',
		placeholder: 'Select billing period',
		onChange: () => {},
	},
} satisfies Meta<typeof DateRangePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: (args) => {
		const [range, setRange] = useState<{ startDate?: Date; endDate?: Date }>({
			startDate: new Date(2026, 4, 1),
			endDate: new Date(2026, 4, 31),
		});
		return <DateRangePicker {...args} startDate={range.startDate} endDate={range.endDate} onChange={setRange} />;
	},
};
