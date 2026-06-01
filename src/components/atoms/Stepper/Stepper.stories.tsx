import type { Meta, StoryObj } from '@storybook/react';
import Stepper from './Stepper';

const meta = {
	title: 'Flexprice/Atoms/Stepper',
	component: Stepper,
	tags: ['autodocs'],
	argTypes: {
		activeStep: { control: { type: 'number', min: 0, max: 3, step: 1 } },
		steps: { table: { disable: true } },
	},
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

const steps = [{ label: 'Plan' }, { label: 'Prices' }, { label: 'Review' }, { label: 'Publish' }];

export const Default: Story = {
	args: {
		steps,
		activeStep: 1,
	},
};
