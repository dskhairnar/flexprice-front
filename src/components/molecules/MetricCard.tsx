import { formatNumber } from '@/utils/common';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
	title: string;
	/** null/undefined means the value is unknown; 0 means it is known to be zero. */
	value: number | null | undefined;
	currency?: string;
	isPercent?: boolean;
	showChangeIndicator?: boolean;
	isNegative?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
	title,
	value,
	currency,
	isPercent = false,
	showChangeIndicator = false,
	isNegative = false,
}) => {
	const arrowColor = isNegative ? 'text-danger' : 'text-success';

	// formatNumber returns '-' for any falsy input, so a metric that is genuinely
	// zero rendered as '$ -' — which reads as a formatting or API failure rather
	// than a real amount. A known zero is a number and formats like one; only an
	// absent value gets a dash, and an em dash so the two cannot be confused.
	// (Same distinction formatCurrencyAmount already makes.)
	const formatKnown = (amount: number) => (amount === 0 ? (0).toFixed(2) : formatNumber(amount, 2));

	const renderValue = () => {
		if (value === null || value === undefined || Number.isNaN(value)) return '—';
		if (isPercent) {
			return `${formatKnown(value)}%`;
		}
		if (currency) {
			return `${getCurrencySymbol(currency)} ${formatKnown(value)}`;
		}
		return formatKnown(value);
	};

	return (
		<div className='bg-surface border border-line p-[25px] flex flex-col gap-3 rounded-md'>
			<p className='text-[14px] leading-[21px] text-content-tertiary font-normal'>{title}</p>
			<p className='text-[24px] leading-[28px] font-medium text-content flex items-center'>
				{renderValue()}
				{showChangeIndicator && (
					<span className={`inline-block ${arrowColor} ms-3`}>{isNegative ? <TrendingDown size={18} /> : <TrendingUp size={18} />}</span>
				)}
			</p>
		</div>
	);
};

export default MetricCard;
