import { CouponAssociation } from '@/models/CouponAssociation';
import { Pagination } from '@/models';
import { QueryFilter } from './base';
import { TypedBackendFilter, TypedBackendSort } from '../formatters/QueryBuilder';

export interface CouponAssociationFilter extends Omit<QueryFilter, 'sort'> {
	filters?: TypedBackendFilter[];
	sort?: TypedBackendSort[];
	subscription_ids?: string[];
	coupon_ids?: string[];
	subscription_line_item_ids?: string[];
	subscription_phase_ids?: string[];
	active_only?: boolean;
	period_start?: string;
	period_end?: string;
}

export interface ListCouponAssociationsResponse {
	items: CouponAssociation[];
	pagination: Pagination;
}
