import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import FeatureMultiSelect from './FeatureMultiSelect';

/**
 * Scaffolded by `npm run storybook:gen`. Edit freely — this file is never regenerated in place
 * unless you pass `--force`.
 *
 * Before you call it done: cover the states that actually break — loading, empty, error, long
 * text, disabled — and check the story in dark mode and in Arabic (toolbar).
 */
const meta: Meta<typeof FeatureMultiSelect> = {
	title: 'Atoms/FeatureMultiSelect',
	component: FeatureMultiSelect,
	args: {
		onChange: fn(),
		values: [],
		error: 'This field is required',
		label: 'Monthly minutes',
		placeholder: 'Search…',
		description: 'Charged per 1,000 API calls, billed monthly in arrears.',
		disabledFeatures: [],
		maxCount: 0,
		onFeaturesFetched: fn(),
	},
	argTypes: {
		onChange: { action: 'onChange' },
		values: { control: 'object' },
		error: { control: 'text' },
		label: { control: 'text' },
		placeholder: { control: 'text' },
		description: { control: 'text' },
		className: { control: 'text' },
		disabledFeatures: { control: 'object' },
		maxCount: { control: 'number' },
		onFeaturesFetched: { action: 'onFeaturesFetched' },
	},
};

export default meta;
type Story = StoryObj<typeof FeatureMultiSelect>;

export const Default: Story = {};
