import { describe, expect, it, vi, beforeEach } from 'vitest';
import { BILLING_MODEL, PRICE_TYPE, PRICE_UNIT_TYPE, type Price } from '@/models/Price';
import { INVOICE_CADENCE } from '@/models/Invoice';
import { BILLING_PERIOD } from '@/constants/constants';
import { PriceApi } from '@/api/PriceApi';
import {
	attachCommitmentBucketPrices,
	collectCommitmentBucketPriceIds,
} from '@/utils/subscription/subscription_line_item_commitment_helpers';

vi.mock('@/api/PriceApi', () => ({
	PriceApi: {
		GetPriceById: vi.fn(),
	},
}));

describe('commitment bucket price resolution', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('collects unique price ids from buckets without inline prices', () => {
		const ids = collectCommitmentBucketPriceIds([
			{
				start: { hour: 0, minute: 0 },
				end: { hour: 1, minute: 0 },
				price_id: 'price_a',
			},
			{
				start: { hour: 1, minute: 0 },
				end: { hour: 2, minute: 0 },
				price_id: 'price_b',
			},
		]);

		expect(ids).toEqual(['price_a', 'price_b']);
	});

	it('attaches each fetched price to the matching bucket', async () => {
		const priceA = {
			id: 'price_a',
			amount: '2',
			currency: 'usd',
			type: PRICE_TYPE.USAGE,
			price_unit_type: PRICE_UNIT_TYPE.FIAT,
			billing_period: BILLING_PERIOD.MONTHLY,
			billing_period_count: 1,
			billing_model: BILLING_MODEL.FLAT_FEE,
			invoice_cadence: INVOICE_CADENCE.ARREAR,
			meter_id: 'meter_01',
		} as Price;
		const priceB = {
			...priceA,
			id: 'price_b',
			amount: '5',
		} as Price;

		vi.mocked(PriceApi.GetPriceById).mockImplementation(async (id: string) => {
			if (id === 'price_a') return priceA;
			if (id === 'price_b') return priceB;
			throw new Error(`unexpected price id ${id}`);
		});

		const priceIds = collectCommitmentBucketPriceIds([
			{
				start: { hour: 0, minute: 0 },
				end: { hour: 0, minute: 57 },
				price_id: 'price_a',
				commitment_value: '10',
			},
			{
				start: { hour: 1, minute: 0 },
				end: { hour: 2, minute: 0 },
				price_id: 'price_b',
				commitment_value: '2',
			},
		]);

		const pricesById: Record<string, Price> = {};
		const fetched = await Promise.all(priceIds.map((id) => PriceApi.GetPriceById(id)));
		for (const price of fetched) {
			pricesById[price.id] = price;
		}

		const buckets = attachCommitmentBucketPrices(
			[
				{
					start: { hour: 0, minute: 0 },
					end: { hour: 0, minute: 57 },
					price_id: 'price_a',
					commitment_value: '10',
				},
				{
					start: { hour: 1, minute: 0 },
					end: { hour: 2, minute: 0 },
					price_id: 'price_b',
					commitment_value: '2',
				},
			],
			pricesById,
		);

		expect(PriceApi.GetPriceById).toHaveBeenCalledTimes(2);
		expect(PriceApi.GetPriceById).toHaveBeenCalledWith('price_a');
		expect(PriceApi.GetPriceById).toHaveBeenCalledWith('price_b');
		expect(buckets[0].price?.amount).toBe('2');
		expect(buckets[1].price?.amount).toBe('5');
	});
});
