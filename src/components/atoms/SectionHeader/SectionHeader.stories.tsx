import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import SectionHeader from './SectionHeader';

/**
 * Scaffolded by `npm run storybook:gen`. Edit freely — this file is never regenerated in place
 * unless you pass `--force`.
 *
 * Before you call it done: cover the states that actually break — loading, empty, error, long
 * text, disabled — and check the story in dark mode and in Arabic (toolbar).
 */
const meta: Meta<typeof SectionHeader> = {
	title: 'Atoms/SectionHeader',
	component: SectionHeader,
	args: {
		children: 'Sample content',
		title: 'Metered usage',
		showSearch: false,
		onSearch: fn(),
		onSearchClick: fn(),
		variant: 'default',
		onFilterClick: fn(),
		showFilter: false,
		showButton: false,
		onButtonClick: fn(),
		titleVariant: 'default',
	},
	argTypes: {
		children: { control: 'text' },
		title: { control: 'text' },
		className: { control: 'text' },
		showSearch: { control: 'boolean' },
		onSearch: { action: 'onSearch' },
		onSearchClick: { action: 'onSearchClick' },
		variant: { control: 'select', options: ['default', 'form-component-title', 'sub-header', 'form-title'] },
		onFilterClick: { action: 'onFilterClick' },
		showFilter: { control: 'boolean' },
		showButton: { control: 'boolean' },
		buttonIcon: { control: 'text' },
		buttonText: { control: 'text' },
		onButtonClick: { action: 'onButtonClick' },
		optionsClassName: { control: 'text' },
		subtitle: { control: 'text' },
		titleClassName: { control: 'text' },
		titleVariant: { control: 'select', options: ['default', 'form-component-title', 'sub-header', 'form-title', 'subtitle', 'card-title'] },
	},
};

export default meta;
type Story = StoryObj<typeof SectionHeader>;

export const Default: Story = {};
