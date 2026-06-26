import { describe, expect, it } from 'vitest';
import { BILLING_MODEL, PRICE_TYPE, PRICE_UNIT_TYPE } from '@/models/Price';
import { INVOICE_CADENCE } from '@/models/Invoice';
import { BILLING_PERIOD } from '@/constants/constants';
import type { Price } from '@/models/Price';
import { CommitmentType } from '@/types/dto/LineItemCommitmentConfig';
import { extractLineItemCommitments } from '@/utils/common/commitment_helpers';
import { buildCommitmentConfigOnSave, sanitizeAddonLineItemCommitmentsForApi } from '@/utils/subscription/addon_commitment_helpers';

const planPrice = {
	id: 'price_01',
	type: PRICE_TYPE.USAGE,
	price_unit_type: PRICE_UNIT_TYPE.FIAT,
	billing_period: BILLING_PERIOD.MONTHLY,
	billing_period_count: 1,
	billing_model: BILLING_MODEL.FLAT_FEE,
	invoice_cadence: INVOICE_CADENCE.ARREAR,
	currency: 'usd',
	amount: '1',
	meter_id: 'meter_01',
	display_name: 'gpu-usage',
} as Price;

const windowConfig = {
	commitment_type: CommitmentType.AMOUNT,
	commitment_amount: 50,
	overage_factor: 1,
	enable_true_up: true,
	is_window_commitment: true,
};

const timeBuckets = [
	{
		start: { hour: 9, minute: 0 },
		end: { hour: 17, minute: 0 },
		commitment_type: CommitmentType.AMOUNT,
		commitment_value: '50',
		overage_factor: '1',
		true_up_enabled: true,
	},
];

describe('window line_item_commitments parent fields', () => {
	it('extractLineItemCommitments includes parent commitment fields for window mode', () => {
		const result = extractLineItemCommitments(
			{
				price_01: {
					price_id: 'price_01',
					commitment: windowConfig,
					commitment_time_buckets: timeBuckets,
				},
			},
			{ prices: [planPrice] },
		);

		expect(result.price_01).toMatchObject({
			commitment_type: CommitmentType.AMOUNT,
			commitment_amount: 50,
			overage_factor: 1,
			enable_true_up: true,
			is_window_commitment: true,
		});
		expect(result.price_01.commitment_time_buckets).toHaveLength(1);
	});

	it('sanitizeAddonLineItemCommitmentsForApi includes parent commitment fields for window mode', () => {
		const stored = buildCommitmentConfigOnSave(windowConfig, timeBuckets);
		const result = sanitizeAddonLineItemCommitmentsForApi({ price_01: stored }, [planPrice]);

		expect(result?.price_01).toMatchObject({
			commitment_type: CommitmentType.AMOUNT,
			commitment_amount: 50,
			overage_factor: 1,
			enable_true_up: true,
			is_window_commitment: true,
		});
		expect(result?.price_01.commitment_time_buckets).toHaveLength(1);
	});
});
