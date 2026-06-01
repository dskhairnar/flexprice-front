import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useState } from 'react';
import { expect, userEvent, within } from '@storybook/test';
import Input from './Input';

const meta = {
	title: 'Flexprice/Atoms/Input',
	component: Input,
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<div className='w-[360px]'>
				<Story />
			</div>
		),
	],
	argTypes: {
		type: { control: 'select', options: ['text', 'number', 'email', 'password'] },
		size: { control: 'select', options: ['xs', 'sm', 'default', 'lg'] },
		disabled: { control: 'boolean' },
		label: { control: 'text' },
		placeholder: { control: 'text' },
		error: { control: 'text' },
		inputPrefix: { table: { disable: true } },
	},
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		label: 'Display name',
		placeholder: 'Acme Inc.',
	},
};

export const NumberField: Story = {
	args: {
		label: 'Seats',
		type: 'number',
		placeholder: '10',
	},
};

export const WithError: Story = {
	args: {
		label: 'Email',
		type: 'email',
		placeholder: 'you@company.com',
		error: 'Enter a valid work email',
	},
};

export const CurrencyPrefix: Story = {
	args: {
		label: 'Unit price',
		value: '49.00',
		size: 'default',
		type: 'text',
	},
	render: function Currency(args) {
		const [v, setV] = useState(String(args.value ?? '49.00'));
		useEffect(() => setV(String(args.value ?? '')), [args.value]);
		return <Input {...args} value={v} onChange={setV} inputPrefix={<span className='text-muted-foreground'>$</span>} />;
	},
};

export const InteractionType: Story = {
	args: {
		label: 'Memo',
		placeholder: 'Add an internal note',
		size: 'default',
	},
	render: function Controlled(args) {
		const [v, setV] = useState('');
		return <Input {...args} value={v} onChange={setV} />;
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await step('User can type into the field', async () => {
			const input = canvas.getByRole('textbox', { name: /memo/i });
			await userEvent.type(input, 'Hello FlexPrice');
			await expect(input).toHaveValue('Hello FlexPrice');
		});
	},
};
