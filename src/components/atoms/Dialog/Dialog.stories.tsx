import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import Dialog from './Dialog';

/**
 * Scaffolded by `npm run storybook:gen`. Edit freely — this file is never regenerated in place
 * unless you pass `--force`.
 *
 * Before you call it done: cover the states that actually break — loading, empty, error, long
 * text, disabled — and check the story in dark mode and in Arabic (toolbar).
 */
const meta: Meta<typeof Dialog> = {
	title: 'Atoms/Dialog',
	component: Dialog,
	args: {
		isOpen: false,
		onOpenChange: fn(),
		title: 'Metered usage',
		description: 'Charged per 1,000 API calls, billed monthly in arrears.',
		children: 'Sample content',
		showCloseButton: true,
		interactiveContent: false,
	},
	argTypes: {
		isOpen: { control: 'boolean' },
		onOpenChange: { action: 'onOpenChange' },
		title: { control: 'text' },
		description: { control: 'text' },
		children: { control: 'text' },
		className: { control: 'text' },
		titleClassName: { control: 'text' },
		descriptionClassName: { control: 'text' },
		showCloseButton: { control: 'boolean' },
		interactiveContent: {
			control: 'boolean',
			description:
				"Opt-in for dialogs rendered inside interactive table rows. Radix portals the content to <body>, but React synthetic clicks still bubble through the React tree to those rows' onClick handlers (which often navigate). When true, the content is marked data-interactive (so Table's isInteractiveElement check short-circuits) and stops click propagation, so in-dialog clicks never trigger the row behind it. Default off — no effect on other dialogs.",
		},
	},
};

export default meta;
type Story = StoryObj<typeof Dialog>;

export const Default: Story = {};
