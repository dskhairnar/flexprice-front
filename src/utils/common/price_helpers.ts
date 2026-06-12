import type { TFunction } from 'i18next';
import { ApiEnum, translateApiEnum } from '@/i18n/display/apiEnums';
import { Price, PRICE_UNIT_TYPE } from '@/models/Price';
import { BILLING_MODEL, PRICE_TYPE, TIER_MODE, CreatePriceTier, TransformQuantity } from '@/models/Price';
import { PriceUnit } from '@/models/PriceUnit';
import { getCurrencySymbol } from './helper_functions';
import { formatLocalizedNumber, formatLocalizedCurrency } from '@/i18n/display/formatNumber';
import { ExtendedPriceOverride } from './price_override_helpers';

/**
 * Normalized price structure - single source of truth for price display
 * This interface represents price data in a consistent format regardless of
 * whether it's FIAT or CUSTOM price unit type
 */
export interface NormalizedPriceDisplay {
	amount: string; // The amount to display
	symbol: string; // Currency/unit symbol to display
	tiers: CreatePriceTier[] | null; // Pricing tiers (null if not tiered)
	billingModel: BILLING_MODEL | 'SLAB_TIERED'; // Billing model
	tierMode: TIER_MODE; // Tier mode (VOLUME or SLAB)
	transformQuantity: TransformQuantity | null; // Transform quantity for package billing
	priceUnitType: PRICE_UNIT_TYPE; // FIAT or CUSTOM
	currency?: string; // FIAT currency code when priceUnitType is FIAT
}

// Helper to get the appropriate symbol for display
const getDisplaySymbol = (price: Price & { pricing_unit?: PriceUnit }): string => {
	// Priority 1: Use pricing_unit.symbol from PriceResponse if available (preferred - has actual symbol like "₿", "€", etc.)
	if (price.price_unit_type === PRICE_UNIT_TYPE.CUSTOM && price.pricing_unit?.symbol) {
		return price.pricing_unit.symbol;
	}

	// Priority 2: Fall back to price_unit_config.price_unit (code string like "BTC", "TOK")
	if (price.price_unit_type === PRICE_UNIT_TYPE.CUSTOM && price.price_unit_config?.price_unit) {
		return price.price_unit_config.price_unit;
	}

	// Priority 3: Use currency symbol for FIAT currencies
	return getCurrencySymbol(price.currency);
};

// Helper to get the appropriate amount for display
const getDisplayAmount = (price: Price): string => {
	if (price.price_unit_type === PRICE_UNIT_TYPE.CUSTOM) {
		// For custom price units, prefer price_unit_amount or price_unit_config.amount
		return price.price_unit_amount || price.price_unit_config?.amount || price.amount || '0';
	}
	return price.amount || '0';
};

// Helper to get the appropriate tiers for display
const getDisplayTiers = (price: Price) => {
	if (price.price_unit_type === PRICE_UNIT_TYPE.CUSTOM) {
		return price.price_unit_tiers || null;
	}
	return price.tiers;
};

/**
 * Normalize a price with optional overrides into a standard format
 * This is the single transformation point for all price display logic
 *
 * @param price - The original price object (may include pricing_unit from API response)
 * @param override - Optional price override configuration
 * @returns NormalizedPriceDisplay - Consistent format for display regardless of price unit type
 */
export const normalizePriceDisplay = (
	price: Price & { pricing_unit?: PriceUnit },
	override?: ExtendedPriceOverride,
): NormalizedPriceDisplay => {
	const isCustomPriceUnit = price.price_unit_type === PRICE_UNIT_TYPE.CUSTOM;

	// Step 1: Extract symbol with correct priority
	// Priority: pricing_unit.symbol > price_unit_config.price_unit > price.price_unit > currency symbol
	let symbol: string;
	if (isCustomPriceUnit) {
		if (price.pricing_unit?.symbol) {
			symbol = price.pricing_unit.symbol;
		} else if (price.price_unit_config?.price_unit) {
			symbol = price.price_unit_config.price_unit;
		} else if (price.price_unit) {
			symbol = price.price_unit;
		} else {
			symbol = getCurrencySymbol(price.currency);
		}
	} else {
		symbol = getCurrencySymbol(price.currency);
	}

	// Step 2: Extract amount based on price unit type and overrides
	let amount: string;
	if (isCustomPriceUnit) {
		// For CUSTOM: override.price_unit_amount > price.price_unit_amount > price_unit_config.amount > price.amount
		amount = override?.price_unit_amount || price.price_unit_amount || price.price_unit_config?.amount || price.amount || '0';
	} else {
		// For FIAT: override.amount > price.amount
		amount = override?.amount || price.amount || '0';
	}

	// Step 3: Extract tiers based on price unit type and overrides
	let tiers: CreatePriceTier[] | null;
	if (isCustomPriceUnit) {
		// For CUSTOM: override.price_unit_tiers > price.price_unit_tiers
		tiers = (override?.price_unit_tiers || price.price_unit_tiers || null) as CreatePriceTier[] | null;
	} else {
		// For FIAT: override.tiers > price.tiers
		tiers = (override?.tiers || price.tiers || null) as CreatePriceTier[] | null;
	}

	// Step 4: Extract billing model and tier mode
	const billingModel: BILLING_MODEL | 'SLAB_TIERED' = override?.billing_model || price.billing_model;
	let tierMode: TIER_MODE = override?.tier_mode || price.tier_mode;

	// Step 5: Handle SLAB_TIERED special case
	// SLAB_TIERED is a frontend convenience representation for TIERED + SLAB mode
	if (billingModel === 'SLAB_TIERED') {
		tierMode = TIER_MODE.SLAB;
	}

	// Step 6: Extract transform quantity
	const transformQuantity = override?.transform_quantity || price.transform_quantity || null;

	return {
		amount,
		symbol,
		tiers,
		billingModel,
		tierMode,
		transformQuantity,
		priceUnitType: price.price_unit_type,
		currency: isCustomPriceUnit ? undefined : price.currency,
	};
};

/**
 * Format price display based on normalized data and billing model
 *
 * @param normalized - The normalized price display data
 * @returns Formatted price string for display
 */
export const formatPriceDisplay = (normalized: NormalizedPriceDisplay): string => {
	const { amount, symbol, billingModel, transformQuantity, tiers, priceUnitType, currency } = normalized;

	const formatFiatAmount = (value: string) =>
		priceUnitType === PRICE_UNIT_TYPE.FIAT && currency
			? formatLocalizedCurrency(value, currency)
			: `${symbol}${formatLocalizedNumber(value)}`;

	switch (billingModel) {
		case BILLING_MODEL.FLAT_FEE:
			return formatFiatAmount(amount);

		case BILLING_MODEL.PACKAGE: {
			const divideBy = transformQuantity?.divide_by || 1;
			return `${formatFiatAmount(amount)} / ${divideBy} units`;
		}

		case BILLING_MODEL.TIERED:
		case 'SLAB_TIERED': {
			const firstTier = tiers?.[0];
			return `starts at ${formatFiatAmount(firstTier?.unit_amount || '0')} per unit`;
		}

		default:
			return formatFiatAmount(amount);
	}
};

export const getBillingModelLabel = (model: BILLING_MODEL | 'SLAB_TIERED', t: TFunction): string =>
	translateApiEnum(t, ApiEnum.billingModel, String(model), { fallback: String(model) });

export const getTierModeLabel = (mode: TIER_MODE, t: TFunction): string =>
	translateApiEnum(t, ApiEnum.tierMode, String(mode), { fallback: String(mode) });

export const getPriceTableCharge = (price: Price & { pricing_unit?: PriceUnit }) => {
	const displaySymbol = getDisplaySymbol(price);
	const displayAmount = getDisplayAmount(price);
	const displayTiers = getDisplayTiers(price);

	if (price.type === PRICE_TYPE.FIXED) {
		return `${displaySymbol}${formatLocalizedNumber(displayAmount)}`;
	} else {
		if (price.billing_model === BILLING_MODEL.PACKAGE) {
			return `${displaySymbol}${formatLocalizedNumber(displayAmount)} / ${formatLocalizedNumber((price.transform_quantity as { divide_by: number }).divide_by.toString())} units`;
		} else if (price.billing_model === BILLING_MODEL.FLAT_FEE) {
			return `${displaySymbol}${formatLocalizedNumber(displayAmount)} / unit`;
		} else if (price.billing_model === BILLING_MODEL.TIERED) {
			const firstTier = displayTiers?.[0];
			return `Starts at ${normalizedPrice ? displaySymbol : displaySymbol}${formatLocalizedNumber(firstTier?.unit_amount?.toString() || '0')} / unit`;
		} else {
			return price.display_amount || `${displaySymbol}${formatLocalizedNumber(displayAmount)}`;
		}
	}
};

export const getActualPriceForTotal = (price: Price) => {
	const displayAmount = getDisplayAmount(price);
	const displayTiers = getDisplayTiers(price);

	let result = 0;
	if (price.billing_model === BILLING_MODEL.PACKAGE) {
		result = parseFloat(displayAmount);
	} else if (price.billing_model === BILLING_MODEL.TIERED) {
		result = parseFloat(String(displayTiers?.[0]?.flat_amount || '0'));
	} else {
		result = parseFloat(displayAmount);
	}

	return result;
};

export const calculateDiscountedPrice = (price: Price, coupon: any) => {
	if (!coupon || price.type !== 'FIXED') return null;

	const originalAmount = parseFloat(price.amount);
	let discountedAmount = originalAmount;

	if (coupon.type === 'fixed') {
		// Fixed amount discount
		const discountAmount = parseFloat(coupon.amount_off || '0');
		discountedAmount = Math.max(0, originalAmount - discountAmount);
	} else if (coupon.type === 'percentage') {
		// Percentage discount
		const discountPercentage = parseFloat(coupon.percentage_off || '0');
		discountedAmount = originalAmount * (1 - discountPercentage / 100);
	}

	return {
		originalAmount,
		discountedAmount,
		savings: originalAmount - discountedAmount,
	};
};
