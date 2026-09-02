import { Card, Chip } from '@/components/atoms';
import { Subscription, SUBSCRIPTION_STATUS } from '@/models/Subscription';
import { formatDateShort } from '@/utils/common/helper_functions';
import { Repeat } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import EmptyState from '../EmptyState';

interface SubscriptionsWidgetProps {
	subscriptions: Subscription[];
	label?: string;
}

const SUBSCRIPTION_CHIP_VARIANT: Record<SUBSCRIPTION_STATUS, 'success' | 'warning' | 'info' | 'default' | 'failed'> = {
	[SUBSCRIPTION_STATUS.ACTIVE]: 'success',
	[SUBSCRIPTION_STATUS.TRIALING]: 'info',
	[SUBSCRIPTION_STATUS.CANCELLED]: 'failed',
	[SUBSCRIPTION_STATUS.INCOMPLETE]: 'warning',
	[SUBSCRIPTION_STATUS.DRAFT]: 'default',
};

const SubscriptionsWidget = ({ subscriptions, label }: SubscriptionsWidgetProps) => {
	const { t } = useTranslation('customer-portal');

	const getStatusChip = (status: SUBSCRIPTION_STATUS) => {
		const variant = SUBSCRIPTION_CHIP_VARIANT[status] ?? 'default';
		return <Chip label={t(`subscriptionStatus.${status}`)} variant={variant} />;
	};

	const activeSubscriptions =
		subscriptions?.filter(
			(sub) => sub.subscription_status === SUBSCRIPTION_STATUS.ACTIVE || sub.subscription_status === SUBSCRIPTION_STATUS.TRIALING,
		) || [];

	if (activeSubscriptions.length === 0) {
		return (
			<Card
				className='rounded-xl p-6'
				style={{ backgroundColor: 'var(--portal-surface, white)', border: '1px solid var(--portal-border, #E9E9E9)' }}>
				<EmptyState icon={<Repeat />} title={t('subscriptions.emptyTitle')} description={t('subscriptions.emptyDescription')} />
			</Card>
		);
	}

	return (
		<Card
			noPadding
			className='rounded-xl overflow-hidden'
			style={{ backgroundColor: 'var(--portal-surface, white)', border: '1px solid var(--portal-border, #E9E9E9)' }}>
			{/* One row per subscription, separated by a rule rather than each sitting in
			    its own bordered box inside this one. The nested cards cost roughly a
			    third of the section's height and read as a second level of hierarchy
			    that the content does not have. */}
			<div
				className='flex items-baseline justify-between gap-3 px-5 py-4'
				style={{ borderBottom: '1px solid var(--portal-border, #E9E9E9)' }}>
				<h3 className='text-sm font-medium' style={{ color: 'var(--portal-text-primary, #09090b)' }}>
					{label || t('subscriptions.title')}
				</h3>
				<span className='text-xs shrink-0' style={{ color: 'var(--portal-text-secondary, #71717a)' }}>
					{t('subscriptions.count', { count: activeSubscriptions.length })}
				</span>
			</div>
			<div className='divide-y' style={{ borderColor: 'var(--portal-border, #E9E9E9)' }}>
				{activeSubscriptions.map((subscription) => (
					<div key={subscription.id} className='flex items-start justify-between gap-4 px-5 py-4'>
						<div className='min-w-0'>
							<h4 className='text-sm font-medium truncate' style={{ color: 'var(--portal-text-primary, #09090b)' }}>
								{subscription.plan?.name || t('subscriptions.unknownPlan')}
							</h4>
							{subscription.plan?.description && (
								<p className='text-xs mt-0.5 line-clamp-1' style={{ color: 'var(--portal-text-secondary, #71717a)' }}>
									{subscription.plan.description}
								</p>
							)}
							{/* One line, middot-separated: the dates are a single fact about the
							    period, not two findings worth their own icons and columns. */}
							<p className='text-xs mt-1' style={{ color: 'var(--portal-text-secondary, #71717a)' }}>
								{formatDateShort(subscription.current_period_start)} – {formatDateShort(subscription.current_period_end)}
								{subscription.subscription_status === SUBSCRIPTION_STATUS.ACTIVE &&
									` · ${t('subscriptions.nextBilling', { date: formatDateShort(subscription.current_period_end) })}`}
								{subscription.subscription_status === SUBSCRIPTION_STATUS.TRIALING &&
									subscription.trial_end &&
									` · ${t('subscriptions.trialEnds', { date: formatDateShort(subscription.trial_end) })}`}
							</p>
						</div>
						<div className='shrink-0'>{getStatusChip(subscription.subscription_status)}</div>
					</div>
				))}
			</div>
		</Card>
	);
};

export default SubscriptionsWidget;
