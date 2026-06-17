import { describe, expect, it } from 'vitest';
import { BILLING_MODEL } from '@/models/Price';
import { billingModelSelectValueFromPrice, hydrateCommitmentTimeBucketsForDisplay } from '@/utils/common/commitment_time_bucket_draft';
import { formatBucketPriceLabel } from '@/utils/subscription/subscription_line_item_commitment_helpers';

describe('billingModelSelectValueFromPrice', () => {
	it('respects FLAT_FEE when transform_quantity is also present', () => {
		const value = billingModelSelectValueFromPrice({
			billing_model: BILLING_MODEL.FLAT_FEE,
			transform_quantity: { divide_by: 1 },
			amount: '5',
		});

		expect(value).toBe(BILLING_MODEL.FLAT_FEE);
	});

	it('infers PACKAGE from transform_quantity when billing_model is missing', () => {
		const value = billingModelSelectValueFromPrice({
			transform_quantity: { divide_by: 100 },
			amount: '10',
		});

		expect(value).toBe(BILLING_MODEL.PACKAGE);
	});
});

describe('commitment bucket flat billing display', () => {
	it('shows flat label instead of package for flat bucket prices with transform_quantity', () => {
		const buckets = hydrateCommitmentTimeBucketsForDisplay([
			{
				start: { hour: 9, minute: 0 },
				end: { hour: 17, minute: 0 },
				commitment_value: '100',
				price: {
					billing_model: BILLING_MODEL.FLAT_FEE,
					amount: '2.50',
					transform_quantity: { divide_by: 1, round: 'up' },
				},
			},
		]);

		const label = formatBucketPriceLabel(buckets[0].price, '$');
		expect(label).toBe('$2.50 flat');
		expect(label).not.toContain('Package');
	});
});
