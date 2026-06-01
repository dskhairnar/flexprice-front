import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import Button from './Button';

const meta = {
	title: 'Flexprice/Atoms/Button',
	component: Button,
	tags: ['autodocs'],
	argTypes: {
		variant: {
			control: 'select',
			options: ['default', 'black', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
		},
		size: { control: 'select', options: ['xs', 'sm', 'default', 'lg', 'icon'] },
		isLoading: { control: 'boolean' },
		disabled: { control: 'boolean' },
		asChild: { table: { disable: true } },
		children: { control: 'text' },
	},
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		children: 'Save changes',
		variant: 'default',
		size: 'default',
	},
};

export const Variants: Story = {
	parameters: {
		controls: { exclude: ['variant'] },
	},
	args: {
		children: 'Button',
		size: 'default',
		isLoading: false,
		disabled: false,
	},
	render: ({ children, size, isLoading, disabled }) => (
		<div className='space-y-4'>
			<div className='flex flex-wrap gap-3'>
				<Button variant='default' size={size} isLoading={isLoading} disabled={disabled}>
					{children} default
				</Button>
				<Button variant='secondary' size={size} isLoading={isLoading} disabled={disabled}>
					{children} secondary
				</Button>
				<Button variant='outline' size={size} isLoading={isLoading} disabled={disabled}>
					{children} outline
				</Button>
				<Button variant='ghost' size={size} isLoading={isLoading} disabled={disabled}>
					{children} ghost
				</Button>
				<Button variant='destructive' size={size} isLoading={isLoading} disabled={disabled}>
					{children} destructive
				</Button>
			</div>
			<p className='text-xs text-muted-foreground'>Use Controls to apply size, loading, disabled, and label text across every variant.</p>
		</div>
	),
};

export const Sizes: Story = {
	args: {
		children: 'Resizable button',
		variant: 'default',
		size: 'default',
		isLoading: false,
		disabled: false,
	},
	render: (args) => (
		<div className='space-y-4'>
			<Button {...args} />
			<div className='flex flex-wrap items-center gap-3 border-t border-border pt-4'>
				<Button variant={args.variant} size='xs' isLoading={args.isLoading} disabled={args.disabled}>
					Extra small reference
				</Button>
				<Button variant={args.variant} size='sm' isLoading={args.isLoading} disabled={args.disabled}>
					Small reference
				</Button>
				<Button variant={args.variant} size='default' isLoading={args.isLoading} disabled={args.disabled}>
					Default reference
				</Button>
				<Button variant={args.variant} size='lg' isLoading={args.isLoading} disabled={args.disabled}>
					Large reference
				</Button>
			</div>
		</div>
	),
};

export const Loading: Story = {
	args: {
		children: 'Processing invoice',
		isLoading: true,
	},
};

export const Disabled: Story = {
	args: {
		children: 'Disabled',
		disabled: true,
	},
};

export const InteractionClick: Story = {
	args: {
		children: 'Click me',
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await step('Click invokes native button', async () => {
			const btn = canvas.getByRole('button', { name: /click me/i });
			await userEvent.click(btn);
			await expect(btn).toBeVisible();
		});
	},
};
