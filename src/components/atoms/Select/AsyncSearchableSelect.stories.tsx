import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import AsyncSearchableSelect from './AsyncSearchableSelect';

/**
 * Scaffolded by `npm run storybook:gen`. Edit freely — this file is never regenerated in place
 * unless you pass `--force`.
 *
 * Before you call it done: cover the states that actually break — loading, empty, error, long
 * text, disabled — and check the story in dark mode and in Arabic (toolbar).
 */
const meta: Meta<typeof AsyncSearchableSelect> = {
	title: 'Atoms/Select/AsyncSearchableSelect',
	component: AsyncSearchableSelect,
	args: {
		// TODO: search is required (SearchConfig) — supply a realistic fixture.
		// TODO: extractors is required (ExtractorsConfig<T>) — supply a realistic fixture.
		display: {},
		options: {},
		onChange: fn(),
		disabled: false,
	},
	argTypes: {
		search: { description: 'Search configuration' },
		extractors: { description: 'Value extraction configuration' },
		display: { description: 'Display configuration' },
		options: { description: 'Options configuration' },
		value: { description: 'Selected value - full object' },
		onChange: { action: 'onChange', description: 'Callback when selection changes' },
		disabled: { control: 'boolean', description: 'Disabled state' },
	},
};

export default meta;
type Story = StoryObj<typeof AsyncSearchableSelect>;

export const Default: Story = {};

export const Disabled: Story = {
	args: { disabled: true },
};
