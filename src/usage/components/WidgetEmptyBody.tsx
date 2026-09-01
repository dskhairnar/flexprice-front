import { cn } from '@/lib/utils';

interface WidgetEmptyBodyProps {
	title: string;
	description: string;
	className?: string;
}

/**
 * The body a usage widget shows when it has loaded and has nothing to display.
 *
 * These widgets used to return null, so a customer with no usage yet opened a
 * section whose date filter floated above blank space — indistinguishable from a
 * widget that had failed to render. Keeping the card and its heading tells them
 * where usage will appear, and leaves the filter above it something to act on.
 */
const WidgetEmptyBody = ({ title, description, className }: WidgetEmptyBodyProps) => (
	<div className={cn('flex flex-col items-center justify-center gap-1 px-4 py-12 text-center', className)}>
		<p className='text-sm font-medium text-content-secondary'>{title}</p>
		<p className='max-w-sm text-xs text-content-secondary'>{description}</p>
	</div>
);

export default WidgetEmptyBody;
