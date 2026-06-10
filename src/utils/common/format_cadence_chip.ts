import { CadenceStatus } from '@/types/common';
import type { TFunction } from 'i18next';

const formatCadenceChip = (data: string, t: TFunction): string => {
	switch (data) {
		case CadenceStatus.ONCE:
			return t('catalog:coupons.drawer.cadenceOnce');
		case CadenceStatus.REPEAT:
			return t('catalog:coupons.drawer.cadenceRepeated');
		case CadenceStatus.FOREVER:
			return t('catalog:coupons.drawer.cadenceForever');
		default:
			return t('catalog:coupons.drawer.cadenceOnce');
	}
};

export default formatCadenceChip;
