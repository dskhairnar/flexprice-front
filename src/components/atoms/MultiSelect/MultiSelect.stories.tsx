import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Gauge, ShieldCheck, Wrench } from 'lucide-react';
import MultiSelect from './MultiSelect';

const options = [
	{ label: 'API calls', value: 'api_calls', icon: Gauge },
	{ label: 'Single sign-on', value: 'sso', icon: ShieldCheck },
	{ label: 'Priority support', value: 'support', icon: Wrench },
	{ label: 'Audit logs', value: 'audit_logs', disabled: true },
];

const meta = {
	title: 'Flexprice/Atoms/MultiSelect',
	component: MultiSelect,
	tags: ['autodocs'],
	args: {
		options,
		defaultValue: ['api_calls'],
		onValueChange: () => {},
		placeholder: 'Select features',
		maxCount: 2,
	},
} satisfies Meta<typeof MultiSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: (args) => {
		const [value, setValue] = useState(args.defaultValue ?? []);
		return (
			<div className='w-96'>
				<MultiSelect {...args} defaultValue={value} onValueChange={setValue} />
			</div>
		);
	},
};
