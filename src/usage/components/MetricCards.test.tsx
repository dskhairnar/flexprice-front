import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import MetricCards from './MetricCards';

describe('MetricCards', () => {
	it('renders a translated title per metric', () => {
		render(
			<MetricCards
				metrics={[
					{ id: 'revenue', titleKey: 'revenue', value: 1000, currency: 'USD' },
					{ id: 'active-calls', titleKey: 'custom', customLabel: 'Active Calls', value: 42 },
				]}
			/>,
		);
		expect(screen.getByText('Revenue')).toBeInTheDocument();
		expect(screen.getByText('Active Calls')).toBeInTheDocument();
	});

	it('renders loading skeletons when isLoading', () => {
		const { container } = render(<MetricCards metrics={[]} isLoading />);
		expect(container.querySelectorAll('[class*="animate-pulse"], .grid > div').length).toBeGreaterThan(0);
	});

	it('renders nothing when not loading and metrics is empty', () => {
		const { container } = render(<MetricCards metrics={[]} />);
		expect(container).toBeEmptyDOMElement();
	});
});
