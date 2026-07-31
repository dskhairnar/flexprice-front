'use client';

import { useCallback, useState } from 'react';
import { CalendarIcon, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import type { CalendarTimezone } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
	formatDateInZone,
	startOfDayInZone,
	convertDateToTimezone,
	toCalendarDisplayDate,
	type DateTimezone,
} from '@/utils/common/format_date';

interface DatePickerProps {
	date: Date | undefined;
	setDate: (date: Date | undefined) => void;
	placeholder?: string;
	disabled?: boolean;
	label?: string;
	minDate?: Date;
	maxDate?: Date;
	/** Shows a clear (X) button on the trigger once a date is picked, resetting it to `undefined`. */
	clearable?: boolean;
	className?: string;
	labelClassName?: string;
	popoverClassName?: string;
	popoverTriggerClassName?: string;
	popoverContentClassName?: string;
	triggerClassName?: string;
}

const DatePicker = ({
	date,
	setDate,
	placeholder = 'Pick a date',
	disabled = false,
	label,
	minDate,
	maxDate,
	clearable = false,
	className,
	labelClassName,
	popoverClassName,
	popoverTriggerClassName,
	popoverContentClassName,
	triggerClassName,
}: DatePickerProps) => {
	const { t: tc } = useTranslation('common');
	const [open, setOpen] = useState(false);
	const [timezone, setTimezone] = useState<CalendarTimezone>('local');

	const handleClear = useCallback(() => {
		setDate(undefined);
		setOpen(false);
	}, [setDate]);

	const handleSelect = useCallback(
		(selected: Date | undefined) => {
			if (!selected) {
				setDate(undefined);
				setOpen(false);
				return;
			}
			const value =
				timezone === 'utc' ? startOfDayInZone(selected.getFullYear(), selected.getMonth(), selected.getDate(), 'utc') : selected;
			setDate(value);
			setOpen(false);
		},
		[setDate, timezone],
	);

	const handleTimezoneChange = useCallback(
		(newTz: CalendarTimezone) => {
			if (date) {
				const converted = convertDateToTimezone(date, timezone as DateTimezone, newTz as DateTimezone);
				setDate(converted);
			}
			setTimezone(newTz);
		},
		[date, timezone, setDate],
	);

	const displayDate = date ? toCalendarDisplayDate(date, timezone as DateTimezone) : undefined;
	const displayLabel = date ? formatDateInZone(date, timezone as DateTimezone) : placeholder;

	const dateBounds = [...(minDate ? [{ before: minDate }] : []), ...(maxDate ? [{ after: maxDate }] : [])];

	const showClear = clearable && !!date && !disabled;

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<div className={cn('flex w-full flex-col', className, popoverTriggerClassName)}>
				{label && <div className={cn('mb-1 w-full text-start text-sm', labelClassName)}>{label}</div>}
				<div className='relative w-full'>
					<PopoverTrigger asChild disabled={disabled}>
						<Button
							variant='outline'
							className={cn(
								'h-10 w-full min-w-0 justify-start text-start font-normal py-1',
								!date && 'text-muted-foreground',
								showClear && 'pe-9',
								triggerClassName,
							)}
							disabled={disabled}
							type='button'>
							<CalendarIcon className='me-2 h-4 w-4 shrink-0' />
							<span className='min-w-0 truncate'>{displayLabel}</span>
						</Button>
					</PopoverTrigger>
					{showClear && (
						<button
							type='button'
							aria-label={tc('dateTime.clear')}
							onClick={handleClear}
							className='absolute end-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'>
							<X className='h-4 w-4' />
						</button>
					)}
				</div>
			</div>
			<PopoverContent className={cn('w-auto p-0 z-[60] pointer-events-auto', popoverClassName, popoverContentClassName)} align='start'>
				<Calendar
					mode='single'
					disabled={disabled || (dateBounds.length ? dateBounds : undefined)}
					selected={displayDate}
					onSelect={handleSelect}
					autoFocus
					startMonth={minDate}
					endMonth={maxDate}
					timezone={timezone}
					onTimezoneChange={handleTimezoneChange}
				/>
			</PopoverContent>
		</Popover>
	);
};

export default DatePicker;
