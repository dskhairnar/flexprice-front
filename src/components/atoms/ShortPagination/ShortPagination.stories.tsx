import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router';
import ShortPagination from './ShortPagination';

const meta = {
	title: 'Flexprice/Atoms/ShortPagination',
	component: ShortPagination,
	tags: ['autodocs'],
	args: {
		totalItems: 84,
		pageSize: 10,
		showPages: true,
		unit: 'customers',
		prefix: 'storybook_customers',
	},
	decorators: [
		(Story) => (
			<MemoryRouter>
				<div className='w-[520px]'>
					<Story />
				</div>
			</MemoryRouter>
		),
	],
} satisfies Meta<typeof ShortPagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
