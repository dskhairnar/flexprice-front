import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FeatureMultiSelect from './FeatureMultiSelect';
import type Feature from '@/models/Feature';
import { FEATURE_TYPE } from '@/models/Feature';
import { ENTITY_STATUS } from '@/models/base';

const features = [
	{
		id: 'feat_api_calls',
		name: 'API calls',
		description: 'Metered API usage',
		type: FEATURE_TYPE.METERED,
	},
	{
		id: 'feat_sso',
		name: 'Single sign-on',
		description: 'Boolean entitlement',
		type: FEATURE_TYPE.BOOLEAN,
	},
	{
		id: 'feat_support',
		name: 'Priority support',
		description: 'Static feature',
		type: FEATURE_TYPE.STATIC,
	},
].map((feature) => ({
	created_at: '2026-05-31T00:00:00.000Z',
	updated_at: '2026-05-31T00:00:00.000Z',
	created_by: 'storybook',
	updated_by: 'storybook',
	tenant_id: 'tenant_storybook',
	environment_id: 'env_storybook',
	status: ENTITY_STATUS.PUBLISHED,
	meter_id: '',
	metadata: {},
	unit_plural: 'units',
	unit_singular: 'unit',
	...feature,
})) as Feature[];

const meta = {
	title: 'Flexprice/Atoms/FeatureMultiSelect',
	component: FeatureMultiSelect,
	tags: ['autodocs'],
	args: {
		label: 'Features',
		placeholder: 'Select features',
		description: 'Storybook uses a seeded query cache for these feature options.',
		values: ['feat_api_calls'],
		onChange: () => {},
		maxCount: 2,
	},
	decorators: [
		(Story) => {
			const queryClient = useMemo(() => {
				const client = new QueryClient({
					defaultOptions: { queries: { staleTime: Infinity, retry: false } },
				});
				client.setQueryData(['fetchFeatures2'], { items: features });
				return client;
			}, []);

			return (
				<QueryClientProvider client={queryClient}>
					<div className='w-96'>
						<Story />
					</div>
				</QueryClientProvider>
			);
		},
	],
} satisfies Meta<typeof FeatureMultiSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: (args) => {
		const [selected, setSelected] = useState(args.values ?? []);
		return <FeatureMultiSelect {...args} values={selected} onChange={(items) => setSelected(items.map((item) => item.id))} />;
	},
};
