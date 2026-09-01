import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface EmptyStateAction {
	label: string;
	onClick: () => void;
}

interface EmptyStateProps {
	/** A small monochrome glyph — sized by this component, so pass the bare icon. */
	icon?: ReactNode;
	title: string;
	description?: string;
	/** The one thing the reader can usefully do next. Omitted when there isn't one. */
	action?: EmptyStateAction;
	className?: string;
}

/**
 * The one empty state, so every surface reads as the same system.
 *
 * Deliberately compact. These sit inside cards sized for populated data, and a
 * message floating in the middle of that much white space reads as a broken
 * widget rather than a deliberate state — so the body stays around 180px and the
 * card's own heading carries the context.
 *
 * Three things, in this order: what is empty, why, and what to do about it. A
 * caller with nothing useful to offer omits the action rather than inventing one.
 */
const EmptyState = ({ icon, title, description, action, className }: EmptyStateProps) => (
	<div className={cn('flex flex-col items-center justify-center gap-2 px-6 py-10 text-center', className)}>
		{icon && (
			<span
				aria-hidden='true'
				className='mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-surface-muted text-content-tertiary [&>svg]:h-5 [&>svg]:w-5'>
				{icon}
			</span>
		)}
		<p className='text-sm font-medium text-content-secondary'>{title}</p>
		{description && <p className='max-w-xs text-xs leading-relaxed text-content-tertiary'>{description}</p>}
		{action && (
			<button
				type='button'
				onClick={action.onClick}
				className='mt-2 text-xs font-medium text-content-secondary underline-offset-4 hover:underline'>
				{action.label} <span aria-hidden='true'>→</span>
			</button>
		)}
	</div>
);

export default EmptyState;
