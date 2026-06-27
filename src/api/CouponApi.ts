import { AxiosClient } from '@/core/axios/verbs';
import { Coupon, Pagination } from '@/models';
import { CreateCouponRequest, UpdateCouponRequest, ListCouponsResponse, CouponFilter } from '@/types/dto';
import { CouponAssociationFilter, ListCouponAssociationsResponse } from '@/types/dto/CouponAssociation';
import { generateQueryParams } from '@/utils/common/api_helper';

class CouponApi {
	private static baseUrl = '/coupons';

	public static async createCoupon(payload: CreateCouponRequest): Promise<Coupon> {
		return await AxiosClient.post(`${this.baseUrl}`, payload);
	}

	public static async getCouponById(id: string): Promise<Coupon> {
		return await AxiosClient.get(`${this.baseUrl}/${id}`);
	}

	public static async updateCoupon(id: string, payload: UpdateCouponRequest): Promise<Coupon> {
		return await AxiosClient.put(`${this.baseUrl}/${id}`, payload);
	}

	public static async deleteCoupon(id: string): Promise<void> {
		return await AxiosClient.delete(`${this.baseUrl}/${id}`);
	}

	public static async getAllCoupons({ limit = 10, offset = 0 }: Pagination): Promise<ListCouponsResponse> {
		const url = generateQueryParams(this.baseUrl, { limit, offset });
		return await AxiosClient.get(url);
	}

	public static async getCouponsByFilters(payload: CouponFilter): Promise<ListCouponsResponse> {
		return await AxiosClient.post(`${this.baseUrl}/search`, payload);
	}

	public static async listCouponAssociations(filter?: CouponAssociationFilter): Promise<ListCouponAssociationsResponse> {
		const url = filter ? generateQueryParams(`${this.baseUrl}/associations`, filter) : `${this.baseUrl}/associations`;
		return await AxiosClient.get<ListCouponAssociationsResponse>(url);
	}
}

export default CouponApi;
