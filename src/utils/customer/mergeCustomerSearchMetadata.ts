import { CUSTOMER_ORG_TYPE_METADATA_KEY, CustomerOrgTypeFilterValue } from '@/constants/customerOrgTypeFilter';

/**
 * Merges the standalone org_type metadata filter into the customer search metadata payload.
 * Existing metadata from the query builder is preserved. When the metadata filter tab already
 * sets `org_type`, that value wins so the existing filter flow is not overridden.
 */
export function mergeCustomerSearchMetadata(
	baseMetadata: Record<string, string> | undefined,
	orgTypeFilter: CustomerOrgTypeFilterValue | null | undefined,
): Record<string, string> | undefined {
	if (baseMetadata?.[CUSTOMER_ORG_TYPE_METADATA_KEY]) {
		return baseMetadata;
	}

	if (!orgTypeFilter) {
		return baseMetadata;
	}

	return {
		...baseMetadata,
		[CUSTOMER_ORG_TYPE_METADATA_KEY]: orgTypeFilter,
	};
}
