import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import AsyncMultiSearchableSelect from './AsyncMultiSearchableSelect';

/**
 * Scaffolded by `npm run storybook:gen`. Edit freely — this file is never regenerated in place
 * unless you pass `--force`.
 *
 * Before you call it done: cover the states that actually break — loading, empty, error, long
 * text, disabled — and check the story in dark mode and in Arabic (toolbar).
 */
const meta: Meta<typeof AsyncMultiSearchableSelect> = {
	title: 'Atoms/Select/AsyncMultiSearchableSelect',
	component: AsyncMultiSearchableSelect,
	args: {
		// TODO: search is required (MultiSearchConfig<T>) — supply a realistic fixture.
		// TODO: extractors is required (ExtractorsConfig<T>) — supply a realistic fixture.
		display: {},
		options: {},
		value: [],
		onChange: fn(),
		disabled: false,
	},
	argTypes: {
		value: { control: 'object' },
		onChange: { action: 'onChange' },
		disabled: { control: 'boolean' },
	},
};

export default meta;
type Story = StoryObj<typeof AsyncMultiSearchableSelect>;

export const Default: Story = {};

export const Disabled: Story = {
	args: { disabled: true },
};
