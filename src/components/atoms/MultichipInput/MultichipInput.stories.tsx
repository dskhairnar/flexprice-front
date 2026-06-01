import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import MultichipInput from './MultiChipInput';

const meta = {
	title: 'Flexprice/Atoms/MultichipInput',
	component: MultichipInput,
	tags: ['autodocs'],
	args: {
		label: 'Allowed domains',
		placeholder: 'Add a domain',
		description: 'Press Enter or Space to add a chip.',
		value: ['acme.com', 'flexprice.io'],
	},
} satisfies Meta<typeof MultichipInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: (args) => {
		const [value, setValue] = useState(['acme.com', 'flexprice.io']);
		return (
			<div className='w-96'>
				<MultichipInput {...args} value={value} onChange={setValue} />
			</div>
		);
	},
};
