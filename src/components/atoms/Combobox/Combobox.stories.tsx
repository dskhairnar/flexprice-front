import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import Combobox from './Combobox';

/**
 * Scaffolded by `npm run storybook:gen`. Edit freely — this file is never regenerated in place
 * unless you pass `--force`.
 *
 * Before you call it done: cover the states that actually break — loading, empty, error, long
 * text, disabled — and check the story in dark mode and in Arabic (toolbar).
 */
const meta: Meta<typeof Combobox> = {
	title: 'Atoms/Combobox',
	component: Combobox,
	args: {
		options: [],
		value: 'sub_01JQ8Z3K4N7P2R9T',
		onChange: fn(),
		placeholder: 'Search…',
		disabled: false,
		width: 200,
		maxHeight: 300,
		onOpenChange: fn(),
		renderOption: fn(),
	},
	argTypes: {
		options: { control: 'object' },
		value: { control: 'text' },
		onChange: { action: 'onChange' },
		placeholder: { control: 'text' },
		emptyText: { control: 'text' },
		searchPlaceholder: { control: 'text' },
		className: { control: 'text' },
		triggerClassName: { control: 'text' },
		contentClassName: { control: 'text' },
		disabled: { control: 'boolean' },
		onOpenChange: { action: 'onOpenChange' },
		renderOption: { action: 'renderOption' },
	},
};

export default meta;
type Story = StoryObj<typeof Combobox>;

export const Default: Story = {};

export const Disabled: Story = {
	args: { disabled: true },
};
