import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
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
	// a chart should be. The empty series is passed through so the chart's own
	// no-data path keeps the titled card at its full height.
	it('keeps the titled chart card when not loading and series is empty', () => {
		render(<UsageTrendChart series={[]} />);
		expect(screen.getByText('Usage Trend')).toBeInTheDocument();
		expect(screen.getByText('No data to display')).toBeInTheDocument();
	});

	it('renders a loading skeleton when isLoading', () => {
		const { container } = render(<UsageTrendChart series={[]} isLoading />);
		expect(container.querySelector('.animate-pulse, [class*="skeleton"]')).not.toBeNull();
	});
});
