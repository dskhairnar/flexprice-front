import type { TFunction } from 'i18next';
import { ApiEnum, translateApiEnum } from '@/i18n/display/apiEnums';

/** Localized label for API entity status (published → active, archived → inactive). */
export function formatEntityStatus(status: string, t: TFunction): string {
	return translateApiEnum(t, ApiEnum.entityStatus, status, { fallback: t('common:status.inactive') });
}
