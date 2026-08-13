import type { Meta, StoryObj } from '@storybook/react-vite';
import FormTitle from './FormHeader';

/**
 * Scaffolded by `npm run storybook:gen`. Edit freely — this file is never regenerated in place
 * unless you pass `--force`.
 *
 * Before you call it done: cover the states that actually break — loading, empty, error, long
 * text, disabled — and check the story in dark mode and in Arabic (toolbar).
 */
const meta: Meta<typeof FormTitle> = {
	title: 'Atoms/FormHeader',
	component: FormTitle,
	args: {
		title: 'Metered usage',
		variant: 'default',
	},
	argTypes: {
		title: { control: 'text' },
		subtitle: { control: 'text' },
		variant: { control: 'select', options: ['default', 'form-component-title', 'sub-header', 'form-title', 'subtitle', 'card-title'] },
		className: { control: 'text' },
		titleClassName: { control: 'text' },
		subtitleClassName: { control: 'text' },
	},
};

export default meta;
type Story = StoryObj<typeof FormTitle>;

export const Default: Story = {};
