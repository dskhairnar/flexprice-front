import type { Meta, StoryObj } from '@storybook/react';
import EmptyState from './QueryableDataArea/EmptyState';
import LoadingState from './QueryableDataArea/LoadingState';
import ErrorState from './QueryableDataArea/ErrorState';

const meta = {
	title: 'Flexprice/Organisms/Organisms Gallery',
	tags: ['autodocs'],
	parameters: {
		layout: 'padded',
	},
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const QueryableStates: Story = {
	render: () => (
		<div className='grid max-w-6xl gap-6 lg:grid-cols-3'>
			<EmptyState
				config={{
					heading: 'No subscriptions yet',
					description: 'Create a subscription to start billing this customer.',
					buttonLabel: 'Create subscription',
					buttonAction: () => {},
				}}
			/>
			<LoadingState />
			<ErrorState error={new Error('Unable to load subscriptions')} />
		</div>
	),
};
