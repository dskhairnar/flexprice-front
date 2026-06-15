import type { CreatePriceTier } from '@/models/Price';
import type { PriceTier } from '@/components/organisms/PlanForm/UsagePricingForm';

/** Empty string is used while the user is clearing/editing; null means infinity on the last tier only. */
export type TierUpTo = number | null | '';

export type TierDraftRow = {
	up_to?: TierUpTo;
	unit_amount?: string;
	flat_amount?: string;
};

export function resolveTierFrom(tiers: TierDraftRow[], index: number): number {
	if (index === 0) return 0;

	for (let i = index - 1; i >= 0; i--) {
		const upTo = tiers[i]?.up_to;
		if (typeof upTo === 'number') return upTo;
	}

	return 0;
}

export function normalizeTierUpToForForm(upTo: TierUpTo | undefined): TierUpTo {
	if (upTo === '') return '';
	return upTo ?? null;
}

export function normalizeTierUpToForDraft(upTo: TierUpTo | undefined): TierUpTo | undefined {
	if (upTo === '') return '';
	return upTo;
}

export function mapTiersToFormRows(tiers: TierDraftRow[]): PriceTier[] {
	return tiers.map((tier, index) => ({
		from: resolveTierFrom(tiers, index),
		up_to: normalizeTierUpToForForm(tier.up_to),
		unit_amount: tier.unit_amount || '',
		flat_amount: tier.flat_amount ?? '0',
	}));
}

export function mapFormRowsToTiers(tiers: Array<{ up_to?: TierUpTo; unit_amount?: string; flat_amount?: string }>): TierDraftRow[] {
	return tiers.map((tier) => ({
		up_to: normalizeTierUpToForDraft(tier.up_to),
		unit_amount: tier.unit_amount || '',
		flat_amount: tier.flat_amount ?? '0',
	}));
}

export function sanitizeTiersForApi(tiers: TierDraftRow[]): CreatePriceTier[] {
	return tiers
		.filter((tier) => tier.unit_amount?.trim() || tier.flat_amount?.trim())
		.map((tier) => ({
			...(typeof tier.up_to === 'number' ? { up_to: tier.up_to } : {}),
			unit_amount: tier.unit_amount || '0',
			flat_amount: tier.flat_amount || '0',
		}));
}

export function formatTierUpToValue(upTo: PriceTier['up_to'], isLastTier: boolean): string {
	if (upTo === null && isLastTier) return '∞';
	if (upTo === '' || upTo === null || upTo === undefined) return '';
	return upTo.toString();
}

export function isInfinityTier(upTo: PriceTier['up_to'], index: number, totalTiers: number): boolean {
	return index === totalTiers - 1 && upTo === null;
}
