import i18n, { type TFunction } from 'i18next';
import { ApiEnum, translateApiEnum } from '@/i18n/display/apiEnums';
import { DEFAULT_CURRENCY_CODE, billlingPeriodOptions, creditGrantPeriodOptions } from '@/constants/constants';
import { getCurrencySymbol as getCurrencyDisplaySymbol } from '@/constants/common';
import { formatLocalizedCurrency, formatLocalizedNumber, resolveCurrencyCode } from '@/i18n/display/formatNumber';
import { getIntlDigitOptions, getIntlLocale } from '@/i18n/display/intlLocale';
import { BILLING_MODEL, Price, PRICE_TYPE } from '@/models/Price';
import { getAllISOCodes } from 'iso-country-currency';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

export { formatLocalizedCurrency, formatLocalizedNumber, resolveCurrencyCode };

export function getCurrencySymbol(currency: string): string {
	return getCurrencyDisplaySymbol(currency);
}

export function getCurrencyName(currency: string): string {
	try {
		const info = getAllISOCodes().filter((code) => code.currency === currency.toUpperCase());
		return info[0]?.countryName || currency;
	} catch (error) {
		console.error('Error getting currency name', error);
		return currency;
	}
}

export const formatBillingModel = (billingModel: string, t: TFunction) =>
	translateApiEnum(t, ApiEnum.billingModel, billingModel, { fallback: '--' });

/** Short unit for price suffixes (e.g. "/ month"). */
export const formatBillingPeriodForPrice = (billingPeriod: string, t: TFunction) =>
	translateApiEnum(t, ApiEnum.billingPeriodUnit, billingPeriod, { fallback: '--' });

/** Adjective form for tables (e.g. "Monthly"). Reuses billing list page keys. */
export const formatBillingPeriodForDisplay = (billingPeriod: string, t: TFunction) =>
	translateApiEnum(t, ApiEnum.billingPeriod, billingPeriod, { fallback: '--' });

/** Localized billing period options for select dropdowns (e.g. Daily, Monthly). */
export const getLocalizedBillingPeriodOptions = (t: TFunction) =>
	billlingPeriodOptions.map((option) => ({
		...option,
		label: translateApiEnum(t, ApiEnum.billingPeriod, option.value, { fallback: option.label }),
	}));

/** Localized grant-period options for credit grant forms. */
export const getLocalizedCreditGrantPeriodOptions = (t: TFunction) =>
	creditGrantPeriodOptions.map((option) => ({
		...option,
		label: translateApiEnum(t, ApiEnum.billingPeriod, option.value, { fallback: option.label }),
	}));

/** Entitlement usage-reset column/dropdown label (e.g. Daily, Monthly). */
export const formatEntitlementUsageResetPeriod = (period: string, t: TFunction) =>
	t(`catalog:entitlements.usageResetPeriod.${period}`, {
		defaultValue: formatBillingPeriodForDisplay(period, t),
	});

function isLatinUnitLabel(text: string): boolean {
	if (!text) return false;
	for (const char of text) {
		const code = char.codePointAt(0) ?? 0;
		const isBasicLatin = code <= 0x7f;
		const isLatinExtended = code >= 0xc0 && code <= 0x24f;
		if (!isBasicLatin && !isLatinExtended) return false;
	}
	return true;
}

/** Prefer i18n unit labels when feature units are not Latin (e.g. stored in another locale). */
export const getEntitlementUnitLabel = (
	feature: { unit_plural?: string | null; unit_singular?: string | null } | undefined,
	count: number,
	t: TFunction,
): string => {
	const unitsDefault = t('catalog:features.form.unitsDefault');
	const unitDefault = t('catalog:features.form.unitDefault');
	const plural = feature?.unit_plural?.trim();
	const singular = feature?.unit_singular?.trim();
	const usePlural = Boolean(plural && isLatinUnitLabel(plural));
	const useSingular = Boolean(singular && isLatinUnitLabel(singular));
	if (count > 1) return usePlural ? plural! : unitsDefault;
	if (count === 1) return useSingular ? singular! : unitDefault;
	return usePlural ? plural! : unitsDefault;
};

/** Show locale-appropriate default credit grant title when the stored name is a known default in any language. */
export const resolveCreditGrantDisplayName = (name: string, t: TFunction): string => {
	const localizedDefault = t('catalog:plans.creditGrants.defaultName');
	const enDefault = i18n.getFixedT('en', 'catalog')('plans.creditGrants.defaultName');
	const arDefault = i18n.getFixedT('ar', 'catalog')('plans.creditGrants.defaultName');
	if (name === enDefault || name === arDefault) return localizedDefault;
	return name;
};

export const SLAB_TIERED_BILLING_MODEL = 'SLAB_TIERED' as const;

/** Localized billing model options with descriptions for usage pricing forms. */
export const getLocalizedUsageBillingModelOptions = (t: TFunction) => [
	{
		value: BILLING_MODEL.FLAT_FEE,
		label: translateApiEnum(t, ApiEnum.billingModel, BILLING_MODEL.FLAT_FEE, { fallback: 'Flat Fee' }),
		description: t('catalog:plans.organisms.usageForm.billingModelDescriptions.flatFee'),
	},
	{
		value: BILLING_MODEL.PACKAGE,
		label: translateApiEnum(t, ApiEnum.billingModel, BILLING_MODEL.PACKAGE, { fallback: 'Package' }),
		description: t('catalog:plans.organisms.usageForm.billingModelDescriptions.package'),
	},
	{
		value: BILLING_MODEL.TIERED,
		label: translateApiEnum(t, ApiEnum.billingModel, BILLING_MODEL.TIERED, { fallback: 'Volume Tiered' }),
		description: t('catalog:plans.organisms.usageForm.billingModelDescriptions.volumeTiered'),
	},
	{
		value: SLAB_TIERED_BILLING_MODEL,
		label: translateApiEnum(t, ApiEnum.billingModel, SLAB_TIERED_BILLING_MODEL, { fallback: 'Slab Tiered' }),
		description: t('catalog:plans.organisms.usageForm.billingModelDescriptions.slabTiered'),
	},
];

export const formatInvoiceCadence = (cadence: string, t: TFunction) =>
	translateApiEnum(t, ApiEnum.invoiceCadence, cadence, { fallback: '--' });

export const getPriceTypeLabel = (type: string | PRICE_TYPE | undefined, t: TFunction): string => {
	if (type == null || type === '') return '--';
	return translateApiEnum(t, ApiEnum.priceType, String(type), { fallback: '--' });
};

export const toSentenceCase = (str: string): string => {
	if (!str) return str;
	return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Formats entity type names for display (e.g., "credit_topups" -> "Credit Top-ups")
 * @param entityType - The entity type to format
 * @returns The formatted entity type name
 */
export const formatEntityType = (entityType: string): string => {
	if (!entityType) return entityType;

	// Handle specific cases
	switch (entityType.toLowerCase()) {
		case 'events':
			return 'Events';
		case 'invoice':
			return 'Invoice';
		case 'credit_topups':
			return 'Credit Top-ups';
		default:
			// Generic formatting: replace underscores with spaces and capitalize each word
			return entityType
				.split('_')
				.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
				.join(' ');
	}
};

/** @param fixedCharges - FIXED-type prices (fixed charges) */
export const getTotalPayableText = (fixedCharges: Price[], usageCharges: Price[], recurringTotal: number) => {
	let text = '';

	if (fixedCharges.length > 0) {
		text += formatLocalizedCurrency(recurringTotal, fixedCharges[0].currency);
	}

	if (usageCharges.length > 0) {
		if (fixedCharges.length > 0) {
			text += ' + Usage';
		} else {
			text += 'Depends on usage';
		}
	}

	return text;
};

/** @param fixedCharges - FIXED-type prices (fixed charges) */
export const getTotalPayableInfo = (fixedCharges: Price[], usageCharges: Price[], recurringTotal: number) => {
	let text = '';

	if (fixedCharges.length > 0) {
		text += formatLocalizedCurrency(recurringTotal, fixedCharges[0].currency);
	}

	if (usageCharges.length > 0) {
		if (fixedCharges.length > 0) {
			text += ' + Usage';
		} else {
			text += 'depending on usage';
		}
	}

	return text;
};

export const formatDateShort = (dateString: string): string => {
	if (!dateString) return '';
	const date = new Date(dateString);
	if (isNaN(date.getTime())) return '';
	const options: Intl.DateTimeFormatOptions = {
		...getIntlDigitOptions(),
		month: 'long',
		day: 'numeric',
		year: 'numeric',
	};
	return date.toLocaleDateString(getIntlLocale(), options);
};

/**
 * Calculates the discount amount based on coupon type and value
 * @param coupon - The coupon object
 * @param originalAmount - The original amount to apply discount to
 * @returns The discount amount
 */
export const calculateCouponDiscount = (
	coupon: { type: string; amount_off?: string; percentage_off?: string },
	originalAmount: number,
): number => {
	if (coupon.type === 'fixed' && coupon.amount_off) {
		return Math.min(parseFloat(coupon.amount_off), originalAmount);
	} else if (coupon.type === 'percentage' && coupon.percentage_off) {
		return (originalAmount * parseFloat(coupon.percentage_off)) / 100;
	}
	return 0;
};

/**
 * Calculates total discount from multiple coupons
 * @param coupons - Array of coupons to apply
 * @param originalAmount - The original amount to apply discounts to
 * @returns The total discount amount
 */
export const calculateTotalCouponDiscount = (
	coupons: { type: string; amount_off?: string; percentage_off?: string }[],
	originalAmount: number,
): number => {
	return coupons.reduce((totalDiscount, coupon) => {
		return totalDiscount + calculateCouponDiscount(coupon, originalAmount);
	}, 0);
};

/**
 * Gets the total payable text including coupon discounts
 * @param fixedCharges - Array of fixed (FIXED type) prices
 * @param usageCharges - Array of usage charges
 * @param recurringTotal - Total fixed-charge amount
 * @param coupons - Array of coupons to apply
 * @returns Formatted text showing total with discounts
 */
export const getTotalPayableTextWithCoupons = (
	fixedCharges: Price[],
	usageCharges: Price[],
	recurringTotal: number,
	coupons: { type: string; amount_off?: string; percentage_off?: string }[] = [],
) => {
	let text = '';

	if (fixedCharges.length > 0) {
		const currency = fixedCharges[0].currency;
		const totalDiscount = calculateTotalCouponDiscount(coupons, recurringTotal);
		const finalAmount = Math.max(0, recurringTotal - totalDiscount);

		text += formatLocalizedCurrency(finalAmount, currency);

		// Show discount information if there are coupons
		if (coupons.length > 0 && totalDiscount > 0) {
			text += ` (${formatLocalizedCurrency(recurringTotal, currency)} - ${formatLocalizedCurrency(totalDiscount, currency)} discount)`;
		}
	}

	if (usageCharges.length > 0) {
		if (fixedCharges.length > 0) {
			text += ' + Usage';
		} else {
			text += 'Depends on usage';
		}
	}

	return text;
};

/**
 * Gets coupon discount breakdown text
 * @param coupons - Array of coupons
 * @param originalAmount - Original amount before discounts
 * @param currency - Currency symbol
 * @returns Formatted text showing coupon breakdown
 */
export const getCouponBreakdownText = (
	coupons: { type: string; amount_off?: string; percentage_off?: string; name?: string }[],
	originalAmount: number,
	currency: string = DEFAULT_CURRENCY_CODE,
) => {
	if (coupons.length === 0) return '';

	let breakdown = '';

	coupons.forEach((coupon, index) => {
		const discount = calculateCouponDiscount(coupon, originalAmount);
		if (discount > 0) {
			if (index > 0) breakdown += ', ';
			breakdown += `${coupon.name || 'Coupon'}: -${formatLocalizedCurrency(discount, currency)}`;
		}
	});

	return breakdown;
};

/**
 * Generates a unique ID using Math.random()
 * @returns A unique ID
 */
export const generateUniqueId = (): string => {
	return uuidv4().replace(/-/g, '');
};

/**
 * Copies text to clipboard and shows a success toast message
 * @param textToCopy - The text string to copy to clipboard
 * @param toastMessage - The message to display in the success toast
 * @returns Promise that resolves when copy is complete, or rejects on error
 */
export const copyToClipboard = async (textToCopy: string, toastMessage: string): Promise<void> => {
	try {
		await navigator.clipboard.writeText(textToCopy);
		toast.success(toastMessage);
	} catch (error) {
		toast.error(i18n.t('common:toast.copyFailedRetry'));
		throw error;
	}
};
