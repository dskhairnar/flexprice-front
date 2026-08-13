import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import SelectFeature from './SelectFeature';

/**
 * Scaffolded by `npm run storybook:gen`. Edit freely — this file is never regenerated in place
 * unless you pass `--force`.
 *
 * Before you call it done: cover the states that actually break — loading, empty, error, long
 * text, disabled — and check the story in dark mode and in Arabic (toolbar).
 */
const meta: Meta<typeof SelectFeature> = {
	title: 'Atoms/SelectFeature',
	component: SelectFeature,
	args: {
		onChange: fn(),
		value: 'sub_01JQ8Z3K4N7P2R9T',
		error: 'This field is required',
		label: 'Monthly minutes',
		placeholder: 'Search…',
		description: 'Charged per 1,000 API calls, billed monthly in arrears.',
		disabledFeatures: [],
		featureTypes: [],
		popoverSide: 'bottom',
		popoverAlign: 'start',
	},
	argTypes: {
		onChange: { action: 'onChange' },
		value: { control: 'text' },
		error: { control: 'text' },
		label: { control: 'text' },
		placeholder: { control: 'text' },
		description: { control: 'text' },
		className: { control: 'text' },
		disabledFeatures: { control: 'object' },
		featureTypes: { control: 'object' },
		popoverSide: {
			control: 'select',
			options: ['top', 'bottom', 'left', 'right'],
			description: 'Popover side positioning - where the dropdown appears relative to the trigger',
		},
		popoverAlign: { control: 'select', options: ['start', 'center', 'end'], description: 'Popover align positioning' },
	},
};

export default meta;
type Story = StoryObj<typeof SelectFeature>;

export const Default: Story = {};
