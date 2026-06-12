import { cn } from '@/lib/utils';
import { currencySymbolNeedsDedicatedFont } from '@/constants/currencyDefaults';
import { getLocalizedCurrencySymbol } from './formatNumber';

interface CurrencyInputPrefixProps {
	currency: string;
	className?: string;
}

/** Currency symbol for amount inputs — uses the SAR web font when Geist would show ¤. */
export function CurrencyInputPrefix({ currency, className }: CurrencyInputPrefixProps) {
	const symbol = getLocalizedCurrencySymbol(currency);

	return (
		<span className={cn('shrink-0 text-muted-foreground', currencySymbolNeedsDedicatedFont(currency) && 'font-saudi-riyal', className)}>
			{symbol}
		</span>
	);
}
