import type { Meta, StoryObj } from '@storybook/react';
import CodePreview from './CodePreview';

const meta = {
	title: 'Flexprice/Atoms/CodePreview',
	component: CodePreview,
	tags: ['autodocs'],
	args: {
		title: 'Usage event',
		language: 'json',
		code: `{
  "customer_id": "cus_123",
  "event_name": "api_call",
  "properties": { "tokens": 1240 }
}`,
	},
} satisfies Meta<typeof CodePreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
