import { UsageRecord, Pagination } from '@/models';
import { QueryFilter } from './base';
import { TypedBackendFilter, TypedBackendSort } from '@/types/formatters/QueryBuilder';

/** POST /usage-records/search body — the only usage-record listing endpoint the backend exposes. */
export interface UsageRecordFilter extends Omit<QueryFilter, 'sort'> {
	subscription_id?: string;
	customer_id?: string;
	customer_external_id?: string;
	plan_id?: string;
	currency?: string;
	synced?: boolean;
	period_start?: string;
	period_end?: string;
	start_time?: string;
	end_time?: string;
	filters?: TypedBackendFilter[];
	sort?: TypedBackendSort[];
}

export interface ListUsageRecordsResponse {
	items: UsageRecord[];
	pagination: Pagination;
}
