import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import DateRangePicker from './DateRangePicker';

describe('DateRangePicker', () => {
	// PopoverTrigger renders its own <button>, so wrapping the trigger Button put a
	// button inside a button: invalid HTML, two tab stops, and the popup semantics
	// on the outer element rather than the one that takes focus.
	it('renders no button nested inside another button', () => {
		const { container } = render(<DateRangePicker onChange={vi.fn()} placeholder='Pick a range' />);
		expect(container.querySelectorAll('button button')).toHaveLength(0);
	});

	// The aria belongs on the element that takes focus, or a screen-reader user
	// never hears that the control opens anything.
	it('puts the popup semantics on the focusable button', () => {
		const { container } = render(<DateRangePicker onChange={vi.fn()} placeholder='Pick a range' />);
		const trigger = container.querySelector('button');
		expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
	});

	// Callers target the trigger with descendant selectors and widths; both must
	// still land on the outermost box, as they did when it was the trigger button.
	it('keeps popoverTriggerClassName on the outermost box', () => {
		const { container } = render(<DateRangePicker onChange={vi.fn()} popoverTriggerClassName='w-full' />);
		expect(container.firstElementChild).toHaveClass('w-full');
	});
});
