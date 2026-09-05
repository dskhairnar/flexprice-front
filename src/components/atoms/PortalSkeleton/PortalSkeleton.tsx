import { cn } from '@/lib/utils';

/**
 * The portal's placeholder block.
 *
 * The widgets each hand-rolled one against `bg-zinc-100`, a fixed grey from the
 * dashboard's palette. The portal takes its colours from the tenant's theme, so on
 * any dark or branded portal those placeholders were the one thing on screen that
 * ignored it. This reads the same token as every other subtle surface.
 */
const PortalSkeleton = ({ className }: { className?: string }) => (
	<div aria-hidden='true' className={cn('animate-pulse rounded-md bg-surface-subtle', className)} />
);

/** Label-over-value, the shape of a figure in the summary strip. */
export const PortalStatSkeleton = () => (
	<div className='space-y-2'>
		<PortalSkeleton className='h-3 w-16' />
		<PortalSkeleton className='h-6 w-24' />
	</div>
);

/** A stack of full-width bars, for a list or table body that has not arrived. */
export const PortalRowsSkeleton = ({ rows = 4, className }: { rows?: number; className?: string }) => (
	<div className={cn('space-y-3', className)}>
		{Array.from({ length: rows }, (_, i) => (
			<PortalSkeleton key={i} className='h-12 w-full' />
		))}
	</div>
);

export default PortalSkeleton;
