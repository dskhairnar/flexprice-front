import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import * as Lucide from 'lucide-react';
import { Section } from './Swatch';

/**
 * Iconography is Lucide, at 16px (`h-4 w-4`) inline with text and 14px (`h-3.5 w-3.5`) inside dense
 * table rows. Icons inherit `currentColor`, so colour them with a content token on the parent rather
 * than passing a `color` prop.
 */
const meta: Meta = {
	title: 'Design System/Icons',
	parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

type IconComponent = (props: { className?: string }) => React.ReactNode;

/** lucide-react's barrel also exports `createLucideIcon`, `icons`, aliases and types — filter to real components. */
const ICONS = Object.entries(Lucide as unknown as Record<string, unknown>)
	.filter(([name, value]) => /^[A-Z]/.test(name) && !name.endsWith('Icon') && typeof value === 'object' && value !== null)
	.map(([name, value]) => [name, value as IconComponent] as const);

function Gallery() {
	const [query, setQuery] = useState('');
	const matches = ICONS.filter(([name]) => name.toLowerCase().includes(query.toLowerCase()));

	return (
		<Section
			title={`Lucide (${ICONS.length} icons)`}
			description='Filter by name, then import it directly: `import { CreditCard } from "lucide-react"`.'>
			<input
				value={query}
				onChange={(event) => setQuery(event.target.value)}
				placeholder='Search icons…'
				aria-label='Search icons'
				className='mb-6 w-full max-w-sm rounded-md border border-line bg-surface px-3 py-2 text-sm text-content placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-brand-blue'
			/>
			<div className='grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8'>
				{matches.slice(0, 240).map(([name, Icon]) => (
					<div key={name} className='flex flex-col items-center gap-2 rounded-md border border-line p-3 text-content'>
						<Icon className='h-5 w-5' />
						<code className='w-full truncate text-center font-fira-code text-[10px] text-content-tertiary' title={name}>
							{name}
						</code>
					</div>
				))}
			</div>
			{matches.length > 240 && (
				<p className='mt-4 text-xs text-content-muted'>Showing the first 240 of {matches.length} matches — narrow the search.</p>
			)}
			{matches.length === 0 && <p className='text-sm text-content-muted'>No icon matches “{query}”.</p>}
		</Section>
	);
}

export const IconGallery: Story = {
	name: 'Icon gallery',
	render: () => <Gallery />,
};

export const Sizes: Story = {
	render: () => (
		<Section title='Sizes' description='Two sizes cover almost everything. Anything larger is a decorative illustration, not an icon.'>
			<div className='flex items-end gap-8 text-content'>
				{[
					{ className: 'h-3.5 w-3.5', label: 'h-3.5 w-3.5 — dense table rows' },
					{ className: 'h-4 w-4', label: 'h-4 w-4 — inline with text (default)' },
					{ className: 'h-5 w-5', label: 'h-5 w-5 — standalone buttons' },
				].map(({ className, label }) => (
					<div key={label} className='flex flex-col items-center gap-2'>
						<Lucide.CreditCard className={className} />
						<code className='font-fira-code text-xs text-content-tertiary'>{label}</code>
					</div>
				))}
			</div>
		</Section>
	),
};

export const Colors: Story = {
	name: 'Colouring',
	render: () => (
		<Section title='Colouring' description='Icons inherit `currentColor`. Set a content token on the icon or its parent — never a hex.'>
			<div className='flex flex-wrap gap-6'>
				{['text-content', 'text-content-muted', 'text-info', 'text-success', 'text-warning', 'text-danger'].map((className) => (
					<div key={className} className={`flex flex-col items-center gap-2 ${className}`}>
						<Lucide.CircleAlert className='h-5 w-5' />
						<code className='font-fira-code text-xs'>{className}</code>
					</div>
				))}
			</div>
		</Section>
	),
};
