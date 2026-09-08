import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WalletAlertLevel, type WalletAlertDraft } from '@/models/Wallet';
import { toWalletAlertDraft } from '@/utils/wallet/walletAlertUtils';
import WalletAlertThresholdSection, { type WalletAlertThresholdSectionLabels } from './WalletAlertThresholdSection';

const labels: WalletAlertThresholdSectionLabels = {
	thresholds: 'Thresholds',
	unit: 'Unit',
	unitTooltip: 'Currency or percentage',
	unitCurrency: 'Currency',
	unitPercentage: 'Percentage',
	rowDescription: 'Alert when balance falls below',
	amountPlaceholder: '0.00',
	levels: {
		[WalletAlertLevel.CRITICAL]: 'Critical',
		[WalletAlertLevel.WARNING]: 'Warning',
		[WalletAlertLevel.INFO]: 'Info',
	},
};

/** Drives the section the way both call sites do: the draft lives in the parent. */
const Harness = ({ initial, currency }: { initial?: WalletAlertDraft; currency?: string }) => {
	const [draft, setDraft] = useState(initial ?? toWalletAlertDraft({ alert_enabled: true }));
	return <WalletAlertThresholdSection draft={draft} labels={labels} currency={currency} onChange={setDraft} />;
};

const rowInput = (level: string) => screen.getByLabelText(`${level} — Alert when balance falls below`) as HTMLInputElement;

describe('WalletAlertThresholdSection', () => {
	it('renders one row per severity with the fixed falls-below copy and no condition picker', () => {
		render(<Harness />);

		expect(screen.getByText('Critical')).toBeInTheDocument();
		expect(screen.getByText('Warning')).toBeInTheDocument();
		expect(screen.getByText('Info')).toBeInTheDocument();
		expect(screen.getAllByText('Alert when balance falls below')).toHaveLength(3);
		// The Above/Below dropdown is gone — wallet alerts always fire on a falling balance.
		expect(screen.queryByText('Above')).not.toBeInTheDocument();
		expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
	});

	it('shows the currency symbol in currency mode and % in percentage mode', () => {
		render(<Harness currency='USD' />);
		expect(screen.getAllByText('$')).toHaveLength(3);
		expect(screen.queryByText('%')).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole('button', { name: 'Percentage' }));
		expect(screen.getAllByText('%')).toHaveLength(3);
		expect(screen.queryByText('$')).not.toBeInTheDocument();
	});

	it('keeps each unit’s values independent across a switch and back', () => {
		render(<Harness currency='USD' />);

		fireEvent.change(rowInput('Critical'), { target: { value: '10' } });
		fireEvent.change(rowInput('Warning'), { target: { value: '25' } });

		fireEvent.click(screen.getByRole('button', { name: 'Percentage' }));
		// Percentage starts empty rather than inheriting the currency amounts.
		expect(rowInput('Critical').value).toBe('');
		fireEvent.change(rowInput('Critical'), { target: { value: '5' } });

		fireEvent.click(screen.getByRole('button', { name: 'Currency' }));
		expect(rowInput('Critical').value).toBe('10');
		expect(rowInput('Warning').value).toBe('25');

		fireEvent.click(screen.getByRole('button', { name: 'Percentage' }));
		expect(rowInput('Critical').value).toBe('5');
	});

	it('omits the currency symbol when no currency applies (tenant-wide defaults)', () => {
		render(<Harness />);
		expect(screen.queryByText('$')).not.toBeInTheDocument();
	});
});
