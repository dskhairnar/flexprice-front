import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import CheckboxRadioGroup, { Props } from './CheckboxRadioGroup';

const queryClient = new QueryClient({
	defaultOptions: {
		mutations: {
			retry: false,
		},
	},
});

const meta = {
	title: 'Flexprice/Atoms/CheckboxRadioGroup',
	component: CheckboxRadioGroup,
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<QueryClientProvider client={queryClient}>
				<MemoryRouter>
					<div className='flex min-h-[180px] items-start justify-center p-8'>
						<Story />
					</div>
				</MemoryRouter>
			</QueryClientProvider>
		),
	],
	argTypes: {
		checkboxItems: { control: 'object' },
		defaultValue: { control: 'text' },
		onChange: { table: { disable: true } },
		value: { control: 'text' },
		title: { control: 'text' },
		error: { control: 'text' },
	},
} satisfies Meta<typeof CheckboxRadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		title: 'Select an option',
		checkboxItems: [
			{ label: 'Option 1', value: 'option1', description: 'This is option 1' },
			{ label: 'Option 2', value: 'option2', description: 'This is option 2' },
			{ label: 'Option 3', value: 'option3', description: 'This is option 3', disabled: true },
		],
		defaultValue: 'option1',
	} as Props,
};

export const WithError: Story = {
	args: {
		title: 'Select an option',
		checkboxItems: [
			{ label: 'Option 1', value: 'option1', description: 'This is option 1' },
			{ label: 'Option 2', value: 'option2', description: 'This is option 2' },
			{ label: 'Option 3', value: 'option3', description: 'This is option 3', disabled: true },
		],
		defaultValue: 'option1',
		error: 'Please select an option',
	} as Props,
};
