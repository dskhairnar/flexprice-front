import { BaseModel, Metadata } from './base';
import { COUPON_TYPE, COUPON_CADENCE, CouponRules } from '@/types/common/Coupon';

export interface Coupon extends BaseModel {
	name: string;
	redeem_after?: string;
	redeem_before?: string;
	max_redemptions?: number;
	total_redemptions: number;
	rules?: CouponRules;
	amount_off?: string;
	percentage_off?: string;
	type: COUPON_TYPE;
	cadence: COUPON_CADENCE;
	duration_in_periods?: number;
	currency: string;
	coupon_code?: string;
	metadata?: Metadata;
}
