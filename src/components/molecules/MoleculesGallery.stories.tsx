import type { Meta, StoryObj } from '@storybook/react';
import MetricCard from './MetricCard';
import DetailsCard from './DetailsCard/DetailsCard';

const meta = {
	title: 'Flexprice/Molecules/Molecules Gallery',
	tags: ['autodocs'],
	parameters: {
		layout: 'padded',
	},
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Summary: Story = {
	render: () => (
		<div className='max-w-5xl space-y-6'>
			<div className='grid gap-4 md:grid-cols-3'>
				<MetricCard title='Revenue' value={12450} currency='USD' showChangeIndicator />
				<MetricCard title='Churn' value={2.4} isPercent showChangeIndicator isNegative />
				<MetricCard title='Usage events' value={982340} />
			</div>
			<DetailsCard
				title='Invoice details'
				gridCols={2}
				data={[
					{ label: 'Customer', value: 'Acme Inc.' },
					{ label: 'Status', value: 'Ready', tag: { text: 'Active', variant: 'subtle' } },
					{ label: 'Billing period', value: 'May 1 - May 31' },
					{ label: 'Collection method', value: 'Automatic' },
				]}
			/>
		</div>
	),
};
