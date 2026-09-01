import { BaseModel } from './base';

export interface UsageRecordSyncEntry {
	agreement_id: string;
	reporting_id: string;
	synced_at: string;
	skipped?: boolean;
	skip_reason?: string;
	connection_id: string;
}

export interface UsageRecord extends BaseModel {
	customer_id: string;
	customer_external_id: string;
	subscription_id: string;
	plan_id: string;
	quantity: string;
	amount: string;
	currency: string;
	period_start: string;
	period_end: string;
	synced: boolean;
	syncs: Record<string, UsageRecordSyncEntry>;
}
