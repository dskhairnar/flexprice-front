import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import MultiSelect from './MultiSelect';

/**
 * Scaffolded by `npm run storybook:gen`. Edit freely — this file is never regenerated in place
 * unless you pass `--force`.
 *
 * Before you call it done: cover the states that actually break — loading, empty, error, long
 * text, disabled — and check the story in dark mode and in Arabic (toolbar).
 */
const meta: Meta<typeof MultiSelect> = {
	title: 'Atoms/MultiSelect',
	component: MultiSelect,
	args: {
		options: [],
		onValueChange: fn(),
		defaultValue: [],
		placeholder: 'Search…',
		animation: 0,
		maxCount: 3,
		modalPopover: false,
		asChild: false,
		customDisplay: fn(),
		variant: 'default',
	},
	argTypes: {
		options: {
			control: 'object',
			description:
				'An array of option objects to be displayed in the multi-select component. Each option object has a label, value, and an optional icon.',
		},
		onValueChange: {
			action: 'onValueChange',
			description: 'Callback function triggered when the selected values change. Receives an array of the new selected values.',
		},
		defaultValue: { control: 'object', description: 'The default selected values when the component mounts.' },
		placeholder: {
			control: 'text',
			description: 'Placeholder text to be displayed when no values are selected. Optional, defaults to "Select options".',
		},
		animation: {
			control: 'number',
			description: 'Animation duration in seconds for the visual effects (e.g., bouncing badges). Optional, defaults to 0 (no animation).',
		},
		maxCount: {
			control: 'number',
			description: 'Maximum number of items to display. Extra selected items will be summarized. Optional, defaults to 3.',
		},
		modalPopover: {
			control: 'boolean',
			description:
				'The modality of the popover. When set to true, interaction with outside elements will be disabled and only popover content will be visible to screen readers. Optional, defaults to false.',
		},
		asChild: {
			control: 'boolean',
			description: 'If true, renders the multi-select component as a child of another component. Optional, defaults to false.',
		},
		className: {
			control: 'text',
			description:
				'Additional class names to apply custom styles to the multi-select component. Optional, can be used to add custom styles.',
		},
		triggerClassName: {
			control: 'text',
			description:
				'Additional class names to apply custom styles to the trigger of the multi-select component. Optional, can be used to add custom styles.',
		},
		customDisplay: {
			action: 'customDisplay',
			description:
				'Custom display function for the trigger button. Receives the count of selected items and returns a custom React element.',
		},
		variant: { control: 'select', options: ['default', 'destructive', 'secondary', 'inverted'] },
	},
};

export default meta;
type Story = StoryObj<typeof MultiSelect>;

export const Default: Story = {};
