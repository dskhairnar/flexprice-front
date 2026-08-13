import { useEffect, useState } from 'react';

/**
 * Shared presentational pieces for the Design System docs pages.
 *
 * These read the *live* computed value of each CSS variable off `document.documentElement` rather
 * than printing the hex from the token table. That way the docs can never drift from what the
 * stylesheet actually ships, and flipping the Storybook theme toolbar re-reads every swatch.
 */

/** Re-reads on every theme change, so swatches follow the light/dark toolbar. */
function useComputedVar(name: string): string {
	const [value, setValue] = useState('');

	useEffect(() => {
		const read = () => setValue(getComputedStyle(document.documentElement).getPropertyValue(name).trim());
		read();

		// `withThemeByClassName` toggles `.dark` on <html>; watch for it instead of polling.
		const observer = new MutationObserver(read);
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
		return () => observer.disconnect();
	}, [name]);

	return value;
}

/** `'107 114 128'` -> `'#6b7280'`. Returns '' for anything that isn't three channels. */
function channelsToHex(channels: string): string {
	const parts = channels
		.split(/[\s,]+/)
		.filter(Boolean)
		.map(Number);
	if (parts.length < 3 || parts.some(Number.isNaN)) return '';
	return `#${parts
		.slice(0, 3)
		.map((c) => c.toString(16).padStart(2, '0'))
		.join('')}`;
}

export function TokenSwatch({ name, note }: { name: string; note?: string }) {
	const cssVar = `--fp-${name}`;
	const channels = useComputedVar(cssVar);
	const hex = channelsToHex(channels);

	return (
		<div className='flex items-start gap-3 rounded-md border border-line p-3'>
			<div
				className='mt-0.5 h-10 w-10 shrink-0 rounded-md border border-line'
				style={{ backgroundColor: channels ? `rgb(${channels})` : 'transparent' }}
			/>
			<div className='min-w-0'>
				<code className='block font-fira-code text-xs text-content'>{cssVar}</code>
				<code className='block font-fira-code text-xs text-content-muted'>{hex || channels || 'unset'}</code>
				{note && <p className='mt-1 text-xs leading-snug text-content-tertiary'>{note}</p>}
			</div>
		</div>
	);
}

export function SwatchGrid({ children }: { children: React.ReactNode }) {
	return <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>{children}</div>;
}

export function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
	return (
		<section className='mb-10'>
			<h2 className='mb-1 text-base font-semibold text-content-heading'>{title}</h2>
			{description && <p className='mb-4 max-w-3xl text-sm leading-relaxed text-content-tertiary'>{description}</p>}
			{children}
		</section>
	);
}
