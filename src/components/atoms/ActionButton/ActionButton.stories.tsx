import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import ActionButton from './ActionButton';

/**
 * Scaffolded by `npm run storybook:gen`. Edit freely — this file is never regenerated in place
 * unless you pass `--force`.
 *
 * Before you call it done: cover the states that actually break — loading, empty, error, long
 * text, disabled — and check the story in dark mode and in Arabic (toolbar).
 */
const meta: Meta<typeof ActionButton> = {
	title: 'Atoms/ActionButton',
	component: ActionButton,
	args: {
		id: 'plan_01JQ8Z3K4N7P2R9T',
		deleteMutationFn: fn(),
		refetchQueryKey: 'Sample content',
		entityName: 'Sample content',
		customActions: [],
		disableToast: false,
		onEdit: fn(),
		isArchiveDisabled: false,
		isEditDisabled: false,
	},
	argTypes: {
		id: { control: 'text' },
		deleteMutationFn: { action: 'deleteMutationFn' },
		refetchQueryKey: { control: 'text' },
		entityName: { control: 'text' },
		triggerIcon: { control: 'text' },
		customActions: { control: 'object' },
		copyId: { description: 'Opt-in "Copy ID" menu item, rendered first. Omit to leave the menu unchanged.' },
		disableToast: { control: 'boolean' },
		editPath: { control: 'text' },
		onEdit: { action: 'onEdit' },
		isArchiveDisabled: { control: 'boolean' },
		isEditDisabled: { control: 'boolean' },
		archiveText: { control: 'text' },
		editText: { control: 'text' },
		archiveIcon: { control: 'text' },
		editIcon: { control: 'text' },
	},
};

export default meta;
type Story = StoryObj<typeof ActionButton>;

export const Default: Story = {};
