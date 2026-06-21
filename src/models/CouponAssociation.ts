import { BaseModel } from './base';
import { Coupon } from './Coupon';

export interface CouponAssociation extends BaseModel {
	coupon_id: string;
	subscription_id: string;
	subscription_line_item_id?: string;
	subscription_phase_id?: string;
	start_date: string;
	end_date?: string;
	coupon?: Coupon;
}
