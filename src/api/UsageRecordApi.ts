import { AxiosClient } from '@/core/axios/verbs';
import { UsageRecordFilter, ListUsageRecordsResponse } from '@/types/dto';

class UsageRecordApi {
	private static baseUrl = '/usage-records/search';

	public static async searchUsageRecords(payload: UsageRecordFilter): Promise<ListUsageRecordsResponse> {
		return await AxiosClient.post<ListUsageRecordsResponse>(this.baseUrl, payload);
	}
}

export default UsageRecordApi;
