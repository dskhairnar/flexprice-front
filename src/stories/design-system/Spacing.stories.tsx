import type { Meta, StoryObj } from '@storybook/react-vite';
import { Section } from './Swatch';

/**
 * Spacing, radius and elevation. The radius scale is deliberately flat — every named step from `sm`
 * to `3xl` is 6px in `tailwind.config.js`, so "which radius?" is never a decision. Only `rounded-full`
 * differs.
 */
const meta: Meta = {
	title: 'Design System/Spacing',
	parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

const SCALE = [
	{ step: '0.5', px: 2 },
	{ step: '1', px: 4 },
	{ step: '1.5', px: 6 },
	{ step: '2', px: 8 },
	{ step: '3', px: 12 },
	{ step: '4', px: 16 },
	{ step: '5', px: 20 },
	{ step: '6', px: 24 },
	{ step: '8', px: 32 },
	{ step: '10', px: 40 },
	{ step: '12', px: 48 },
	{ step: '16', px: 64 },
];

export const SpacingScale: Story = {
	name: 'Spacing scale',
	render: () => (
		<Section
			title='Spacing scale'
			description='Tailwind default 4px base. Card padding is `p-6`; the gap between stacked sections is `gap-4`.'>
			<div className='flex flex-col gap-2'>
				{SCALE.map(({ step, px }) => (
					<div key={step} className='flex items-center gap-4'>
						<code className='w-16 shrink-0 font-fira-code text-xs text-content-secondary'>{step}</code>
						<code className='w-14 shrink-0 font-fira-code text-xs text-content-tertiary'>{px}px</code>
						<div className='h-4 rounded-sm bg-brand-blue' style={{ width: `${px}px` }} />
					</div>
				))}
			</div>
		</Section>
	),
};

export const Radius: Story = {
	render: () => (
		<Section
			title='Radius'
			description='Every named step is 6px on purpose — a single corner radius across the product. Reach for `rounded-full` only for pills and avatars.'>
			<div className='flex flex-wrap gap-4'>
				{['rounded-sm', 'rounded-md', 'rounded-lg', 'rounded-xl', 'rounded-2xl', 'rounded-full'].map((className) => (
					<div key={className} className='flex flex-col items-center gap-2'>
						<div className={`h-20 w-20 border border-line bg-surface-subtle ${className}`} />
						<code className='font-fira-code text-xs text-content-tertiary'>{className}</code>
					</div>
				))}
			</div>
		</Section>
	),
};

export const Surfaces: Story = {
	render: () => (
		<Section
			title='Surfaces & elevation'
			description='Depth comes from stacked surface tokens, not from shadows. In dark mode the shell is the *darkest* layer and panels sit lighter on top of it.'>
			<div className='rounded-md bg-surface-shell p-6'>
				<code className='mb-3 block font-fira-code text-xs text-content-tertiary'>bg-surface-shell — app chrome</code>
				<div className='rounded-md bg-surface-canvas p-6'>
					<code className='mb-3 block font-fira-code text-xs text-content-tertiary'>bg-surface-canvas — page background</code>
					<div className='rounded-md border border-line bg-surface p-6'>
						<code className='mb-3 block font-fira-code text-xs text-content-tertiary'>bg-surface — the card</code>
						<div className='rounded-md bg-surface-subtle p-4'>
							<code className='font-fira-code text-xs text-content-tertiary'>bg-surface-subtle — recessed well / table header</code>
						</div>
					</div>
				</div>
			</div>
		</Section>
	),
};
