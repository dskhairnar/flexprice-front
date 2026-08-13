import type { Meta, StoryObj } from '@storybook/react-vite';
import { Section } from './Swatch';

/**
 * The type system: Geist for UI, Fira Code for anything the user could copy-paste (IDs, keys, code).
 * `font-sans` resolves through `--font-sans`, which `initTypography()` can override per tenant — so
 * always reach for `font-sans` rather than naming Geist directly.
 */
const meta: Meta = {
	title: 'Design System/Typography',
	parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

const SIZES = [
	{ className: 'text-xs', label: 'text-xs', note: 'Overridden to 12px (Tailwind default is 12px/16px)' },
	{ className: 'text-sm', label: 'text-sm', note: 'Overridden to 14px — the workhorse body size' },
	{ className: 'text-base', label: 'text-base', note: '16px' },
	{ className: 'text-lg', label: 'text-lg', note: '18px' },
	{ className: 'text-xl', label: 'text-xl', note: '20px' },
	{ className: 'text-2xl', label: 'text-2xl', note: '24px' },
	{ className: 'text-3xl', label: 'text-3xl', note: '30px' },
];

const WEIGHTS = [
	{ className: 'font-normal', label: 'font-normal (400)' },
	{ className: 'font-medium', label: 'font-medium (500)' },
	{ className: 'font-semibold', label: 'font-semibold (600)' },
	{ className: 'font-bold', label: 'font-bold (700)' },
];

const COLORS = [
	{ className: 'text-content', label: 'text-content', note: 'Default body / headings' },
	{ className: 'text-content-heading', label: 'text-content-heading', note: 'Section titles' },
	{ className: 'text-content-secondary', label: 'text-content-secondary', note: 'Supporting copy' },
	{ className: 'text-content-tertiary', label: 'text-content-tertiary', note: 'Captions, helper text' },
	{ className: 'text-content-muted', label: 'text-content-muted', note: 'De-emphasised metadata' },
	{ className: 'text-content-subtle', label: 'text-content-subtle', note: 'Lowest-emphasis text that still must pass AA' },
	{ className: 'text-content-disabled', label: 'text-content-disabled', note: 'Deliberately sub-AA — must read as disabled' },
];

const SAMPLE = 'Metered usage reconciled against the March invoice';

const Row = ({ label, note, children }: { label: string; note?: string; children: React.ReactNode }) => (
	<div className='flex flex-col gap-1 border-b border-line py-4 last:border-b-0 md:flex-row md:items-baseline md:gap-6'>
		<div className='w-64 shrink-0'>
			<code className='font-fira-code text-xs text-content-secondary'>{label}</code>
			{note && <p className='mt-0.5 text-xs text-content-tertiary'>{note}</p>}
		</div>
		<div className='min-w-0 flex-1'>{children}</div>
	</div>
);

export const Families: Story = {
	render: () => (
		<Section
			title='Families'
			description='`font-sans` is variable — it reads `--font-sans`, which a tenant can rebrand at runtime. Use `font-fira-code` for anything copy-pasteable.'>
			<Row label='font-sans' note='Geist by default'>
				<p className='font-sans text-lg text-content'>{SAMPLE}</p>
			</Row>
			<Row label='font-fira-code' note='IDs, API keys, code'>
				<p className='font-fira-code text-lg text-content'>sub_01JQ8Z3K4N7P2R9T</p>
			</Row>
		</Section>
	),
};

export const Sizes: Story = {
	render: () => (
		<Section title='Sizes' description='`text-xs` and `text-sm` are overridden to fixed pixel values in tailwind.config.js.'>
			{SIZES.map(({ className, label, note }) => (
				<Row key={label} label={label} note={note}>
					<p className={`${className} text-content`}>{SAMPLE}</p>
				</Row>
			))}
		</Section>
	),
};

export const Weights: Story = {
	render: () => (
		<Section title='Weights' description='Geist is a variable font, so every weight below is a real cut rather than a synthesised one.'>
			{WEIGHTS.map(({ className, label }) => (
				<Row key={label} label={label}>
					<p className={`${className} text-base text-content`}>{SAMPLE}</p>
				</Row>
			))}
		</Section>
	),
};

export const TextColors: Story = {
	name: 'Text colours',
	render: () => (
		<Section title='Text colours' description='The content ramp. Everything except `text-content-disabled` clears WCAG AA on app surfaces.'>
			{COLORS.map(({ className, label, note }) => (
				<Row key={label} label={label} note={note}>
					<p className={`${className} text-base`}>{SAMPLE}</p>
				</Row>
			))}
		</Section>
	),
};
