import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import WalletAlertThresholdCard from './WalletAlertThresholdCard';

const labels = {
	title: 'Critical',
	description: 'Alert at critical level',
	add: 'Add',
	remove: 'Remove',
	thresholdValue: 'Balance is below',
	condition: 'Condition',
	conditionBelow: 'Below',
	conditionAbove: 'Above',
	amountPlaceholder: '0.00',
};

const threshold = { threshold: '10', condition: 'below' as const };

describe('WalletAlertThresholdCard', () => {
	it('renders no unit suffix when unit is not provided', () => {
		render(
			<WalletAlertThresholdCard
				threshold={threshold}
				labels={labels}
				onAdd={vi.fn()}
				onRemove={vi.fn()}
				onThresholdChange={vi.fn()}
				onConditionChange={vi.fn()}
			/>,
		);
		expect(screen.queryByText('%')).not.toBeInTheDocument();
	});

	it('renders a percent suffix when unit="%"', () => {
		render(
			<WalletAlertThresholdCard
				threshold={threshold}
				labels={labels}
				unit='%'
				onAdd={vi.fn()}
				onRemove={vi.fn()}
				onThresholdChange={vi.fn()}
				onConditionChange={vi.fn()}
			/>,
		);
		expect(screen.getByText('%')).toBeInTheDocument();
	});

	it('renders a currency-code suffix when unit is a currency string', () => {
		render(
			<WalletAlertThresholdCard
				threshold={threshold}
				labels={labels}
				unit='USD'
				onAdd={vi.fn()}
				onRemove={vi.fn()}
				onThresholdChange={vi.fn()}
				onConditionChange={vi.fn()}
			/>,
		);
		expect(screen.getByText('USD')).toBeInTheDocument();
	});

	it('keeps the stored threshold value a bare number, never including the unit', () => {
		render(
			<WalletAlertThresholdCard
				threshold={threshold}
				labels={labels}
				unit='%'
				onAdd={vi.fn()}
				onRemove={vi.fn()}
				onThresholdChange={vi.fn()}
				onConditionChange={vi.fn()}
			/>,
		);
		expect(screen.getByDisplayValue('10')).toBeInTheDocument();
	});
});
