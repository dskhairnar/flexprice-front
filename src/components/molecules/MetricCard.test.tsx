import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import MetricCard from './MetricCard';

describe('MetricCard', () => {
	// formatNumber returns '-' for any falsy input, so a metric genuinely worth
	// zero rendered as '$ -' — which reads as a formatting or API failure.
	it('renders a known zero as an amount, not a dash', () => {
		render(<MetricCard title='Total spend' value={0} currency='USD' />);
		expect(screen.getByText('$ 0.00')).toBeInTheDocument();
	});

	// The distinction that makes the zero readable: absent data still gets a dash,
	// an em dash, so the two states cannot be confused for each other.
	it('renders an em dash when the value is unknown', () => {
		render(<MetricCard title='Total spend' value={null} currency='USD' />);
		expect(screen.getByText('—')).toBeInTheDocument();
	});

	it('renders a zero percentage as 0.00%', () => {
		render(<MetricCard title='Margin' value={0} isPercent />);
		expect(screen.getByText('0.00%')).toBeInTheDocument();
	});

	it('still formats a real amount', () => {
		render(<MetricCard title='Total spend' value={1234.5} currency='USD' />);
		expect(screen.getByText('$ 1,234.50')).toBeInTheDocument();
	});
});
