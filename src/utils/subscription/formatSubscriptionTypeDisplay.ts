import type { TFunction } from 'i18next';
import { SUBSCRIPTION_TYPE } from '@/models/Subscription';
import { ApiEnum, translateApiEnum } from '@/i18n/display/apiEnums';

/** Human-readable label for API `subscription_type` (snake_case enums or unknown values). */
export function formatSubscriptionTypeDisplayLabel(raw: string | null | undefined, t: TFunction): string {
	if (!raw?.trim()) {
		return translateApiEnum(t, ApiEnum.subscriptionType, SUBSCRIPTION_TYPE.STANDALONE);
	}
	return translateApiEnum(t, ApiEnum.subscriptionType, raw.trim());
}
