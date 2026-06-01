import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { MoreHorizontal, RefreshCw } from 'lucide-react';
import ActionButton from './ActionButton';

const queryClient = new QueryClient({
	defaultOptions: {
		mutations: {
			retry: false,
		},
	},
});

const meta = {
	title: 'Flexprice/Atoms/ActionButton',
	component: ActionButton,
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
		id: { control: 'text' },
		entityName: { control: 'text' },
		refetchQueryKey: { control: 'text' },
		deleteMutationFn: { table: { disable: true } },
		triggerIcon: { table: { disable: true } },
		edit: { control: 'object' },
		archive: { control: 'object' },
		customActions: { control: 'object' },
		disableToast: { control: 'boolean' },
	},
} satisfies Meta<typeof ActionButton>;

export default meta;
type Story = StoryObj<typeof meta>;

const deleteMutationFn = async () => undefined;

export const Default: Story = {
	args: {
		entityName: 'Customer',
		id: 'cus_123',
		refetchQueryKey: 'customers',
		deleteMutationFn,
		disableToast: true,
		edit: {
			text: 'Edit customer',
			onClick: () => undefined,
		},
		archive: {
			text: 'Archive customer',
		},
	},
};

export const CustomTrigger: Story = {
	args: {
		...Default.args,
		triggerIcon: <MoreHorizontal className='size-5 rounded border border-border p-0.5' />,
	},
};

export const CustomActions: Story = {
	args: {
		...Default.args,
		customActions: [
			{
				text: 'Sync customer',
				icon: <RefreshCw className='size-4' />,
				onClick: () => undefined,
			},
		],
	},
};

export const ArchiveOnly: Story = {
	args: {
		...Default.args,
		edit: {
			enabled: false,
		},
		archive: {
			text: 'Suspend customer',
		},
	},
};
