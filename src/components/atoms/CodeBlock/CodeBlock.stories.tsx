import type { Meta, StoryObj } from '@storybook/react';
import CodeBlock from './CodeBlock';

const meta = {
	title: 'Flexprice/Atoms/CodeBlock',
	component: CodeBlock,
	tags: ['autodocs'],
	args: {
		language: 'tsx',
		code: `const plan = {
  name: 'Launch',
  interval: 'monthly',
  price: 49,
};`,
	},
} satisfies Meta<typeof CodeBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
