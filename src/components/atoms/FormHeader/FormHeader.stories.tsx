import type { Meta, StoryObj } from '@storybook/react';
import FormHeader from './FormHeader';

const meta = {
	title: 'Flexprice/Atoms/FormHeader',
	component: FormHeader,
	tags: ['autodocs'],
	args: {
		variant: 'form-title',
		title: 'Create plan',
		subtitle: 'Set pricing, billing cycle, and usage limits.',
	},
	argTypes: {
		variant: {
			control: 'select',
			options: ['form-component-title', 'sub-header', 'form-title', 'default', 'subtitle', 'card-title'],
		},
	},
} satisfies Meta<typeof FormHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
