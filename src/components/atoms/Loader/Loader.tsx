import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LOADING_QUOTE_KEYS, { translateLoadingQuote, type LoadingQuoteKey } from '@/constants/loading_quotes';

const getRandomQuoteKey = (): LoadingQuoteKey => {
	const randomIndex = Math.floor(Math.random() * LOADING_QUOTE_KEYS.length);
	return LOADING_QUOTE_KEYS[randomIndex]!;
};

const Loader = () => {
	const { t, i18n } = useTranslation('common');
	const [quoteKey, setQuoteKey] = useState<LoadingQuoteKey>(getRandomQuoteKey);
	const [fadeOut, setFadeOut] = useState(false);
	const [, setTranslationTick] = useState(0);

	const getQuote = useCallback((key: LoadingQuoteKey) => translateLoadingQuote(t, key), [t]);

	useEffect(() => {
		const interval = setInterval(() => {
			setFadeOut(true);

			setTimeout(() => {
				setQuoteKey(getRandomQuoteKey());
				setFadeOut(false);
			}, 300);
		}, 4000);

		return () => clearInterval(interval);
	}, []);

	// Re-render when translations load or locale changes so quotes resolve instead of showing raw keys.
	useEffect(() => {
		const refresh = () => setTranslationTick((n) => n + 1);
		i18n.on('loaded', refresh);
		i18n.on('languageChanged', refresh);
		return () => {
			i18n.off('loaded', refresh);
			i18n.off('languageChanged', refresh);
		};
	}, [i18n]);

	return (
		<div className='w-full h-full flex items-center justify-center bg-white/80 z-50'>
			<div className='flex flex-col items-center gap-4 max-w-md text-center px-4'>
				<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto'></div>
				<p
					className={`
						text-sm text-gray-600 
						transition-all duration-600 ease-in-out
						${fadeOut ? 'opacity-0 transform -translate-y-2' : 'opacity-100 transform translate-y-0'}
					`}>
					{getQuote(quoteKey)}
				</p>
			</div>
		</div>
	);
};

export default Loader;

export const PageLoader = () => {
	return (
		<div className='h-screen w-full flex items-center justify-center'>
			<Loader />
		</div>
	);
};
