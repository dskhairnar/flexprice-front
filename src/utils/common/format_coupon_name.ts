import { COUPON_CADENCE, COUPON_TYPE } from '@/types/common';
import { formatLocalizedCurrency, formatLocalizedNumber } from './helper_functions';
import { Coupon } from '@/models/Coupon';

const formatCouponName = (coupon: Coupon) => {
	let couponName = '';
	if (coupon.type === COUPON_TYPE.FIXED) {
		couponName = `${formatLocalizedCurrency(coupon.amount_off ?? 0, coupon.currency)} off`;
	} else {
		couponName = `${formatLocalizedNumber(coupon.percentage_off ?? 0, { maximumFractionDigits: 2 })}% off`;
	}
	if (coupon.cadence === COUPON_CADENCE.ONCE) {
		couponName = `${couponName} once`;
	} else if (coupon.cadence === COUPON_CADENCE.REPEATED) {
		couponName = `${couponName} for ${coupon.duration_in_periods} billing cycles`;
	} else if (coupon.cadence === COUPON_CADENCE.FOREVER) {
		couponName = `${couponName} forever`;
	}

	return couponName;
};

export default formatCouponName;
