import type { Meta, StoryObj } from '@storybook/react-vite';
import Stepper from './Stepper';

/**
 * Scaffolded by `npm run storybook:gen`. Edit freely — this file is never regenerated in place
 * unless you pass `--force`.
 *
 * Before you call it done: cover the states that actually break — loading, empty, error, long
 * text, disabled — and check the story in dark mode and in Arabic (toolbar).
 */
const meta: Meta<typeof Stepper> = {
	title: 'Atoms/Stepper',
	component: Stepper,
	args: {
		steps: [],
		activeStep: 0,
	},
	argTypes: {
		steps: { control: 'object' },
		activeStep: { control: 'number' },
	},
};

export default meta;
type Story = StoryObj<typeof Stepper>;

export const Default: Story = {};
