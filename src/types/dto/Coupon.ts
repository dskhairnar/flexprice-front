import { COUPON_TYPE, COUPON_CADENCE, CouponRules } from '@/types/common/Coupon';
import { QueryFilter } from './base';
import { Coupon, Pagination, Metadata } from '@/models';
import { TypedBackendFilter, TypedBackendSort } from '../formatters/QueryBuilder';

export interface CreateCouponRequest {
	name: string;
	coupon_code?: string;
	redeem_after?: string;
	redeem_before?: string;
	max_redemptions?: number;
	rules?: CouponRules;
	amount_off?: string;
	percentage_off?: string;
	type: COUPON_TYPE;
	cadence: COUPON_CADENCE;
	duration_in_periods?: number;
	metadata?: Metadata;
	currency?: string;
}

export interface UpdateCouponRequest {
	name?: string;
	metadata?: Metadata;
}

export interface GetCouponResponse {
	data: Coupon;
}

export interface ListCouponsResponse {
	items: Coupon[];
	pagination: Pagination;
}

export interface CouponFilter extends Omit<QueryFilter, 'sort'> {
	filters?: TypedBackendFilter[];
	sort?: TypedBackendSort[];
	coupon_ids?: string[];
}
