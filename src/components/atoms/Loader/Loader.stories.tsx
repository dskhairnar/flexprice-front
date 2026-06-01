import type { Meta, StoryObj } from '@storybook/react';
import Loader, { PageLoader } from './Loader';

const meta = {
	title: 'Flexprice/Atoms/Loader',
	component: Loader,
	tags: ['autodocs'],
} satisfies Meta<typeof Loader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Inline: Story = {
	render: () => (
		<div className='h-56 w-96 rounded-md border'>
			<Loader />
		</div>
	),
};

export const Page: Story = {
	render: () => <PageLoader />,
};
