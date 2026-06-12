import { cn } from '@/lib/utils';
import { currencySymbolNeedsDedicatedFont } from '@/constants/currencyDefaults';
import { formatLocalizedCurrency, type LocalizedNumberOptions } from './formatNumber';

interface LocalizedCurrencyProps extends LocalizedNumberOptions {
	amount: number | string;
	currency: string;
	className?: string;
}

/** Locale-aware currency display with SAR font fallback when needed. */
export function LocalizedCurrency({ amount, currency, className, ...options }: LocalizedCurrencyProps) {
	return (
		<span className={cn(currencySymbolNeedsDedicatedFont(currency) && 'font-saudi-riyal', className)}>
			{formatLocalizedCurrency(amount, currency, options)}
		</span>
	);
}
