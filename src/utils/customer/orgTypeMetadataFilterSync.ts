import { FilterCondition } from '@/types/common/QueryBuilder';
import { CUSTOMER_ORG_TYPE_METADATA_KEY } from '@/constants/customerOrgTypeFilter';
import { METADATA_TYPED_FILTER_FIELD } from '@/types/formatters/QueryBuilder';

interface MetadataPair {
	key: string;
	value: string;
}

const parseMetadataPairs = (valueString: string | undefined): MetadataPair[] => {
	if (valueString == null || valueString.trim() === '') return [{ key: '', value: '' }];
	try {
		const parsed = JSON.parse(valueString);
		if (Array.isArray(parsed) && parsed.length > 0) return parsed;
	} catch {
		// ignore invalid JSON
	}
	return [{ key: '', value: '' }];
};

const isOrgTypePair = (pair: MetadataPair): boolean => pair.key.trim() === CUSTOMER_ORG_TYPE_METADATA_KEY && pair.value.trim() !== '';

/** True when any metadata filter row targets `org_type` with a non-empty value. */
export function hasOrgTypeInMetadataFilters(filters: FilterCondition[]): boolean {
	return filters.some((filter) => {
		if (filter.field !== METADATA_TYPED_FILTER_FIELD) return false;
		return parseMetadataPairs(filter.valueString).some(isOrgTypePair);
	});
}

/** Removes `org_type` rows from metadata filter conditions so the toolbar button can own that key. */
export function removeOrgTypeFromMetadataFilters(filters: FilterCondition[]): FilterCondition[] {
	let changed = false;

	const nextFilters = filters.map((filter) => {
		if (filter.field !== METADATA_TYPED_FILTER_FIELD) return filter;

		const pairs = parseMetadataPairs(filter.valueString);
		const withoutOrgType = pairs.filter((pair) => pair.key.trim() !== CUSTOMER_ORG_TYPE_METADATA_KEY);
		if (withoutOrgType.length === pairs.length) return filter;

		changed = true;
		const normalized = withoutOrgType.length > 0 ? withoutOrgType : [{ key: '', value: '' }];
		return { ...filter, valueString: JSON.stringify(normalized) };
	});

	return changed ? nextFilters : filters;
}
