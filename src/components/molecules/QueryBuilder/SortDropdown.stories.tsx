import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';
import SortDropdown from './SortDropdown';
import { SortOption, SortDirection } from '@/types/common/QueryBuilder';

const OPTIONS: SortOption[] = [
	{ field: 'name', label: 'Name' },
	{ field: 'created_at', label: 'Created At' },
	{ field: 'updated_at', label: 'Updated At' },
	{ field: 'status', label: 'Status' },
	{ field: 'priority', label: 'Priority' },
	{ field: 'est_hours', label: 'Est. Hours' },
	{ field: 'assigned_to', label: 'Assigned To' },
	{ field: 'due_date', label: 'Due Date' },
];

const meta: Meta<typeof SortDropdown> = {
	title: 'Molecules/QueryBuilder/SortDropdown',
	component: SortDropdown,
	args: {
		options: OPTIONS,
		value: [],
		onChange: fn(),
		disabled: false,
		maxSorts: 10,
	},
	argTypes: {
		options: { control: 'object', description: 'Fields the user may sort by.' },
		value: { control: 'object', description: 'Applied sorts, in priority order. Drag to reorder.' },
		onChange: { action: 'changed', description: 'Fires with the full next sort list on add, remove, reorder or direction flip.' },
		maxSorts: { control: { type: 'number', min: 1, max: 10 }, description: 'Upper bound on simultaneous sorts.' },
		disabled: { control: 'boolean' },
		className: { control: 'text' },
	},
};

export default meta;
type Story = StoryObj<typeof SortDropdown>;

/**
 * `SortDropdown` is controlled — it never holds its own sort list. This wires `value`/`onChange` to
 * local state so the stories are actually interactive, while still forwarding to the `fn()` spy so
 * changes show up in the Actions panel.
 */
const Controlled = ({ value: initial, onChange, ...rest }: React.ComponentProps<typeof SortDropdown>) => {
	const [value, setValue] = useState<SortOption[]>(initial);
	return (
		<SortDropdown
			{...rest}
			value={value}
			onChange={(next) => {
				setValue(next);
				onChange(next);
			}}
		/>
	);
};

export const Default: Story = {
	render: (args) => <Controlled {...args} />,
};

/** Two sorts already applied — the trigger shows the count and the list is drag-reorderable. */
export const WithInitialSorts: Story = {
	args: {
		value: [
			{ field: 'created_at', label: 'Created At', direction: SortDirection.DESC },
			{ field: 'priority', label: 'Priority', direction: SortDirection.ASC },
		],
	},
	render: (args) => <Controlled {...args} />,
};

/** At `maxSorts`, "Add sort" is unavailable — the common cause of a "why can't I add another?" report. */
export const AtMaxSorts: Story = {
	args: {
		maxSorts: 2,
		value: [
			{ field: 'name', label: 'Name', direction: SortDirection.ASC },
			{ field: 'status', label: 'Status', direction: SortDirection.DESC },
		],
	},
	render: (args) => <Controlled {...args} />,
};

/** Every field already used, so there is nothing left to add even below `maxSorts`. */
export const AllFieldsUsed: Story = {
	args: {
		options: OPTIONS.slice(0, 2),
		value: [
			{ field: 'name', label: 'Name', direction: SortDirection.ASC },
			{ field: 'created_at', label: 'Created At', direction: SortDirection.DESC },
		],
	},
	render: (args) => <Controlled {...args} />,
};

export const Disabled: Story = {
	args: { disabled: true },
	render: (args) => <Controlled {...args} />,
};
