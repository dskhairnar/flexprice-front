import { FC } from 'react';
import { Chip, Sheet } from '@/components/atoms';
import { JsonCodeBlock } from '@/components/molecules/Events';
import { UsageRecord } from '@/models';
import { useTranslation } from 'react-i18next';
import { MARKETPLACE_LOGO, getProviderLabel } from './marketplaceProviders';

interface Props {
	record: UsageRecord | null;
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
}

const UsageRecordSyncsDrawer: FC<Props> = ({ record, isOpen, onOpenChange }) => {
	const { t } = useTranslation('settings');

	if (!record) {
		return null;
	}

	const syncEntries = Object.entries(record.syncs ?? {});

	return (
		<Sheet isOpen={isOpen} onOpenChange={onOpenChange} title={t('insightsTools.usageSyncs.drawer.title')} size='2xl'>
			<div className='space-y-4 px-6 pb-6 pt-0'>
				{syncEntries.length === 0 ? (
					<p className='text-sm text-gray-500'>{t('insightsTools.usageSyncs.drawer.empty')}</p>
				) : (
					syncEntries.map(([provider, entry]) => {
						const label = getProviderLabel(t, provider);
						const logo = MARKETPLACE_LOGO[provider];
						return (
							<div key={provider} className='space-y-2'>
								<div className='flex items-center gap-2'>
									<span className='text-sm font-medium text-foreground'>{label}</span>
									<Chip
										variant={entry.skipped ? 'warning' : 'success'}
										label={entry.skipped ? t('insightsTools.usageSyncs.drawer.skipped') : t('insightsTools.usageSyncs.drawer.synced')}
									/>
								</div>
								<JsonCodeBlock value={entry} title={logo ? <img src={logo} alt={label} className='h-4 w-4 object-contain' /> : label} />
							</div>
						);
					})
				)}
			</div>
		</Sheet>
	);
};

export default UsageRecordSyncsDrawer;
