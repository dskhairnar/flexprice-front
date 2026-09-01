import { describe, expect, it } from 'vitest';
import { SUBSCRIPTION_LINE_ITEM_ENTITY_TYPE } from '@/models/Subscription';
import { PRICE_TYPE } from '@/models/Price';
import { CommitmentType } from '@/types/dto/LineItemCommitmentConfig';
import type { SubscriptionLineItemListItem } from '@/types/dto/Subscription';
import { subscriptionLineItemListItemToLineItem } from '@/utils/subscription/subscriptionLineItemListItemToLineItem';
import { lineItemWindowCommitmentStateFromBuckets } from '@/utils/subscription/subscription_line_item_commitment_helpers';

const baseItem: SubscriptionLineItemListItem = {
	id: 'li_01',
	subscription_id: 'sub_01',
	customer_id: 'cus_01',
	price_id: 'price_01',
	price_type: PRICE_TYPE.USAGE,
	currency: 'usd',
	billing_period: 'MONTHLY',
	invoice_cadence: 'ARREAR',
	entity_type: SUBSCRIPTION_LINE_ITEM_ENTITY_TYPE.ADDON,
	entity_id: 'addon_01',
	display_name: 'Addon usage charge',
	quantity: 0,
	start_date: '2026-01-01T00:00:00Z',
	metadata: {},
	created_at: '2026-01-01T00:00:00Z',
	updated_at: '2026-01-01T00:00:00Z',
};

describe('subscriptionLineItemListItemToLineItem', () => {
	it('maps base line item commitment_amount and commitment_duration', () => {
		const lineItem = subscriptionLineItemListItemToLineItem({
			...baseItem,
			commitment_amount: '150',
			commitment_type: CommitmentType.AMOUNT,
			commitment_overage_factor: '1.5',
			commitment_true_up_enabled: true,
			commitment_windowed: true,
			commitment_duration: 'MONTHLY',
		});

		expect(lineItem.commitment_amount).toBe('150');
		expect(lineItem.commitment_duration).toBe('MONTHLY');

		const state = lineItemWindowCommitmentStateFromBuckets(lineItem, []);
		expect(state.commitmentAmount).toBe('150');
		expect(state.commitmentDuration).toBe('MONTHLY');
	});
});
