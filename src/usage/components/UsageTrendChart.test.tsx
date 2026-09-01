import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import UsageTrendChart from './UsageTrendChart';

describe('UsageTrendChart', () => {
	it('renders the chart title and passes series through to the chart', () => {
		render(<UsageTrendChart series={[{ id: 'feat_1', name: 'API Calls', points: [{ timestamp: '2026-01-01T00:00:00Z', usage: 10 }] }]} />);
		expect(screen.getByText('Usage Trend')).toBeInTheDocument();
	});

	// Regression: CustomerUsageChart renders its own Card (a bordered element) internally; this
	// wrapper used to add a second bordered Card around it, producing nested card chrome. No
	// `.border` element should be nested inside another `.border` element.
	it('renders a single card, not a card nested inside another card', () => {
		const { container } = render(
			<UsageTrendChart series={[{ id: 'feat_1', name: 'API Calls', points: [{ timestamp: '2026-01-01T00:00:00Z', usage: 10 }] }]} />,
		);
		const bordered = Array.from(container.querySelectorAll('.border'));
		const nested = bordered.filter((el) => el.parentElement?.closest('.border'));
		expect(nested).toHaveLength(0);
	});

	// Returning null left a customer with no usage yet looking at blank space where
	// a chart should be.
	it('keeps the titled chart card when not loading and series is empty', () => {
		render(<UsageTrendChart series={[]} periodLabel='Aug 26 – Sep 1' />);
		expect(screen.getByText('Usage Trend')).toBeInTheDocument();
		expect(screen.getByText('No usage data yet')).toBeInTheDocument();
		// The period is named, so the customer can trust what "this period" means.
		expect(screen.getByText('Aug 26 – Sep 1')).toBeInTheDocument();
	});

	// CustomerUsageChart's own no-data path stacks "No usage data available" above
	// "No data to display" in a 250px void — two ways of saying nothing is here.
	it('states the empty case once, not twice', () => {
		render(<UsageTrendChart series={[]} />);
		expect(screen.queryByText('No data to display')).not.toBeInTheDocument();
		expect(screen.queryByText('No usage data available')).not.toBeInTheDocument();
	});

	it('offers the action it is given, and nothing when there is none', () => {
		const onClick = vi.fn();
		const { rerender } = render(<UsageTrendChart series={[]} emptyAction={{ label: 'View plan', onClick }} />);
		screen.getByRole('button', { name: /view plan/i }).click();
		expect(onClick).toHaveBeenCalled();

		rerender(<UsageTrendChart series={[]} />);
		expect(screen.queryByRole('button')).not.toBeInTheDocument();
	});

	it('renders a loading skeleton when isLoading', () => {
		const { container } = render(<UsageTrendChart series={[]} isLoading />);
		expect(container.querySelector('.animate-pulse, [class*="skeleton"]')).not.toBeNull();
	});
});
