import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import Dialog from '@/components/atoms/Dialog';
import SubscriptionApi from '@/api/SubscriptionApi';
import { AddonAssociationResponse, UpdateSubscriptionLineItemRequest } from '@/types/dto/Subscription';
import { LineItem, SUBSCRIPTION_LINE_ITEM_EDIT_MODE } from '@/models/Subscription';
import { EXPAND } from '@/models';
import SubscriptionLineItemTable from '@/components/molecules/SubscriptionLineItemTable/SubscriptionLineItemTable';
import { SubscriptionLineItemQuantityModifyDialog } from '@/components/molecules';
import PriceOverrideDialog from '@/components/molecules/PriceOverrideDialog/PriceOverrideDialog';
import { getPriceTypeFromLineItem, lineItemToPrice } from '@/utils/subscription/lineItemToPrice';
import { subscriptionLineItemListItemToLineItem } from '@/utils/subscription/subscriptionLineItemListItemToLineItem';
import { PRICE_TYPE } from '@/models/Price';
import { ExtendedPriceOverride } from '@/utils/common/price_override_helpers';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import toast from 'react-hot-toast';

interface Props {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	subscriptionId: string;
	association: AddonAssociationResponse | null;
	currentPeriodStart?: string;
	currentPeriodEnd?: string;
	readOnly?: boolean;
}

type EditingLineItemState =
	| { mode: SUBSCRIPTION_LINE_ITEM_EDIT_MODE.USAGE_OVERRIDE; lineItem: LineItem }
	| { mode: SUBSCRIPTION_LINE_ITEM_EDIT_MODE.FIXED_QUANTITY; lineItem: LineItem }
	| null;

/**
 * Configure the charges of one addon already attached to a subscription.
 *
 * The backend has no update endpoint for the addon association itself, so
 * configuration operates on the addon's subscription line items: price
 * overrides go through PUT /subscriptions/lineitems/{id}; termination goes
 * through DELETE /subscriptions/lineitems/{id} with an effective date.
 */
const ConfigureAddonDialog: React.FC<Props> = ({
	isOpen,
	onOpenChange,
	subscriptionId,
	association,
	currentPeriodStart,
	currentPeriodEnd,
	readOnly = false,
}) => {
	const { t } = useTranslation(['billing', 'customers']);
	const [editingLineItem, setEditingLineItem] = useState<EditingLineItemState>(null);
	const [overriddenPrices, setOverriddenPrices] = useState<Record<string, ExtendedPriceOverride>>({});

	const {
		data: lineItemsResponse,
		isLoading,
		refetch,
	} = useQuery({
		queryKey: ['addonAssociationLineItems', subscriptionId, association?.id],
		queryFn: async () =>
			SubscriptionApi.searchSubscriptionLineItems({
				subscription_ids: [subscriptionId],
				addon_association_ids: [association!.id],
				active_filter: false,
				expand: EXPAND.PRICES,
				limit: 100,
				offset: 0,
			}),
		enabled: isOpen && !!association?.id,
	});

	const lineItems = useMemo(() => (lineItemsResponse?.items ?? []).map(subscriptionLineItemListItemToLineItem), [lineItemsResponse?.items]);

	const invalidateAddonQueries = useCallback(() => {
		void refetch();
		void refetchQueries(['subscriptionActiveAddons', subscriptionId]);
		void refetchQueries(['subscriptionAddonLineItems', subscriptionId]);
		void refetchQueries(['subscriptionEdit', subscriptionId]);
		void refetchQueries(['subscriptionDetails', subscriptionId]);
	}, [refetch, subscriptionId]);

	const { mutate: updateLineItem, isPending: isUpdatingLineItem } = useMutation({
		mutationFn: async ({ lineItemId, updateData }: { lineItemId: string; updateData: UpdateSubscriptionLineItemRequest }) =>
			SubscriptionApi.updateSubscriptionLineItem(lineItemId, updateData),
		onSuccess: () => {
			toast.success(t('customers:subscriptionEdit.toast.lineItemUpdated'));
			invalidateAddonQueries();
		},
		onError: (error: Error) => {
			toast.error(error.message || t('customers:subscriptionEdit.toast.lineItemUpdateFailed'));
		},
	});

	const { mutate: terminateLineItem } = useMutation({
		mutationFn: async ({ lineItemId, endDate }: { lineItemId: string; endDate?: string }) =>
			SubscriptionApi.deleteSubscriptionLineItem(lineItemId, endDate ? { effective_from: endDate } : {}),
		onSuccess: () => {
			toast.success(t('customers:subscriptionEdit.toast.lineItemTerminated'));
			invalidateAddonQueries();
		},
		onError: (error: Error) => {
			toast.error(error.message || t('customers:subscriptionEdit.toast.lineItemTerminateFailed'));
		},
	});

	const handleEditLineItem = useCallback((lineItem: LineItem) => {
		const priceType = getPriceTypeFromLineItem(lineItem);
		if (priceType === PRICE_TYPE.FIXED) {
			setEditingLineItem({ mode: SUBSCRIPTION_LINE_ITEM_EDIT_MODE.FIXED_QUANTITY, lineItem });
		} else {
			setEditingLineItem({ mode: SUBSCRIPTION_LINE_ITEM_EDIT_MODE.USAGE_OVERRIDE, lineItem });
		}
	}, []);

	const handleTerminateLineItem = useCallback(
		(lineItemId: string, endDate?: string) => {
			terminateLineItem({ lineItemId, endDate });
		},
		[terminateLineItem],
	);

	const handleUsageLineItemUpdate = useCallback(
		(updateData: UpdateSubscriptionLineItemRequest) => {
			if (!editingLineItem || editingLineItem.mode !== SUBSCRIPTION_LINE_ITEM_EDIT_MODE.USAGE_OVERRIDE) return;
			updateLineItem({ lineItemId: editingLineItem.lineItem.id, updateData }, { onSuccess: () => setEditingLineItem(null) });
		},
		[editingLineItem, updateLineItem],
	);

	const handleResetOverride = useCallback((priceId: string) => {
		setOverriddenPrices((prev) => {
			const next = { ...prev };
			delete next[priceId];
			return next;
		});
	}, []);

	return (
		<Dialog
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title={t('billing:subscriptions.configureAddonDialog.title')}
			description={association?.addon?.name}
			showCloseButton
			className='sm:max-w-4xl'>
			<div className='mt-3'>
				<SubscriptionLineItemTable
					data={lineItems}
					isLoading={isLoading}
					hideCardWrapper
					readOnly={readOnly}
					onEdit={readOnly ? undefined : handleEditLineItem}
					onTerminate={readOnly ? undefined : handleTerminateLineItem}
					noDataSubtitle={t('billing:subscriptions.configureAddonDialog.empty')}
				/>
			</div>

			{editingLineItem?.mode === SUBSCRIPTION_LINE_ITEM_EDIT_MODE.USAGE_OVERRIDE && (
				<PriceOverrideDialog
					isOpen={true}
					onOpenChange={(open: boolean) => !open && setEditingLineItem(null)}
					price={lineItemToPrice(editingLineItem.lineItem)}
					onPriceOverride={() => {}}
					onResetOverride={handleResetOverride}
					overriddenPrices={overriddenPrices}
					showEffectiveFrom={true}
					lineItem={editingLineItem.lineItem}
					onLineItemUpdate={handleUsageLineItemUpdate}
					isSaving={isUpdatingLineItem}
				/>
			)}

			{editingLineItem?.mode === SUBSCRIPTION_LINE_ITEM_EDIT_MODE.FIXED_QUANTITY && (
				<SubscriptionLineItemQuantityModifyDialog
					isOpen={true}
					onOpenChange={(open: boolean) => !open && setEditingLineItem(null)}
					subscriptionId={subscriptionId}
					lineItem={editingLineItem.lineItem}
					currentPeriodStart={currentPeriodStart ?? ''}
					currentPeriodEnd={currentPeriodEnd ?? ''}
				/>
			)}
		</Dialog>
	);
};

export default ConfigureAddonDialog;
