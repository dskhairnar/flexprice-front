import type { TFunction } from 'i18next';
import { ApiEnum, translateApiEnum } from '@/i18n/display/apiEnums';
import { PRICE_STATUS } from '@/models/Price';

/** Localized label for API entity status (published → active, archived → inactive). */
export function formatEntityStatus(status: string, t: TFunction): string {
	return translateApiEnum(t, ApiEnum.entityStatus, status, { fallback: t('common:status.inactive') });
}

/** Localized label for price/charge lifecycle status (active, upcoming, inactive). */
export function formatPriceStatus(status: PRICE_STATUS | string, t: TFunction): string {
	switch (status) {
		case PRICE_STATUS.ACTIVE:
			return t('common:status.active');
		case PRICE_STATUS.INACTIVE:
			return t('common:status.inactive');
		case PRICE_STATUS.UPCOMING:
			return t('common:status.upcoming');
		default:
			return status;
	}
}
