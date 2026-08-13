import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import CheckboxRadioGroup from './CheckboxRadioGroup';

/**
 * Scaffolded by `npm run storybook:gen`. Edit freely — this file is never regenerated in place
 * unless you pass `--force`.
 *
 * Before you call it done: cover the states that actually break — loading, empty, error, long
 * text, disabled — and check the story in dark mode and in Arabic (toolbar).
 */
const meta: Meta<typeof CheckboxRadioGroup> = {
	title: 'Atoms/CheckboxRadioGroup',
	component: CheckboxRadioGroup,
	args: {
		checkboxItems: [],
		onChange: fn(),
		value: 'sub_01JQ8Z3K4N7P2R9T',
		title: 'Metered usage',
		error: 'This field is required',
	},
	argTypes: {
		checkboxItems: { control: 'object' },
		defaultValue: { control: 'text' },
		onChange: { action: 'onChange' },
		value: { control: 'text' },
		title: { control: 'text' },
		error: { control: 'text' },
	},
};

export default meta;
type Story = StoryObj<typeof CheckboxRadioGroup>;

export const Default: Story = {};
