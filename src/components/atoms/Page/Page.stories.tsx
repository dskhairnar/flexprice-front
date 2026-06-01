import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../Button';
import Card from '../Card';
import Page from './Page';

const meta = {
	title: 'Flexprice/Atoms/Page',
	component: Page,
	tags: ['autodocs'],
	args: {
		heading: 'Revenue overview',
		headingCTA: <Button size='sm'>Export</Button>,
		type: 'default',
	},
} satisfies Meta<typeof Page>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: (args) => (
		<div className='min-h-[360px] bg-muted/30'>
			<Page {...args}>
				<Card className='p-6'>
					<p className='text-sm text-muted-foreground'>Page content is constrained and spaced consistently.</p>
				</Card>
			</Page>
		</div>
	),
};
