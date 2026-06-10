import React from 'react';
import { useTranslation } from 'react-i18next';
import { config, AUTH_PROVIDER } from '@/config/config';
import { Locale } from '@/config/branding';
import { useLocaleStore } from '@/store/useLocaleStore';
import { isCurrentUsRegion } from '@/utils/region/regionUtils';

const FUNDING_URL =
	'https://entrepreneur.economictimes.indiatimes.com/news/funding/flexprice-secures-15-million-in-seed-funding-to-revolutionize-ai-billing-solutions/131320984';

const FundingStrip: React.FC = () => {
	const { t } = useTranslation('common', { keyPrefix: 'fundingStrip' });
	const locale = useLocaleStore((s) => s.locale);

	const showForProdSupabase = config.app.isProd && config.auth.provider === AUTH_PROVIDER.Supabase;
	const showForArabicUs = locale === Locale.Ar && isCurrentUsRegion();

	if (!showForProdSupabase && !showForArabicUs) {
		return null;
	}

	return (
		<div className='w-full flex items-center justify-center px-4 py-1.5 shrink-0' style={{ background: '#092A3D' }}>
			<p className='text-[13px] font-normal text-white'>
				{t('announcement')} &nbsp;|&nbsp;{' '}
				<a
					href={FUNDING_URL}
					target='_blank'
					rel='noopener noreferrer'
					className='text-white font-normal underline hover:opacity-80'
					style={{ textDecoration: 'underline' }}>
					{t('knowMore')}
				</a>
			</p>
		</div>
	);
};

export default FundingStrip;
