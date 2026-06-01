import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';

import { cn } from '@/lib/utils';

export interface CustomProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
	indicatorColor?: string;
	backgroundColor?: string;
	label?: React.ReactNode;
	labelColor?: string;
	className?: string;
}
const Progress = React.forwardRef<React.ElementRef<typeof ProgressPrimitive.Root>, CustomProgressProps>(
	({ className, value, indicatorColor, label, backgroundColor, labelColor, ...props }, ref) => (
		<div className='flex flex-col gap-1'>
			<ProgressPrimitive.Root
				ref={ref}
				className={cn('relative h-4 w-full overflow-hidden rounded-full', backgroundColor ? backgroundColor : 'bg-secondary', className)}
				{...props}>
				<ProgressPrimitive.Indicator
					className={cn('h-full w-full flex-1 transition-all', indicatorColor ? indicatorColor : 'bg-primary')}
					style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
				/>
			</ProgressPrimitive.Root>
			<p className={cn('text-xs font-medium w-full', labelColor)}>{label}</p>
		</div>
	),
);
Progress.displayName = ProgressPrimitive.Root.displayName;

export default Progress;
