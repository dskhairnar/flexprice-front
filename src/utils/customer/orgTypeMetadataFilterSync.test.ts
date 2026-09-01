import { describe, expect, it } from 'vitest';
import { METADATA_TYPED_FILTER_FIELD } from '@/types/formatters/QueryBuilder';
import { FilterOperator, DataType } from '@/types/common/QueryBuilder';
import { hasOrgTypeInMetadataFilters, removeOrgTypeFromMetadataFilters } from './orgTypeMetadataFilterSync';

const metadataFilter = (pairs: Array<{ key: string; value: string }>) => ({
	id: 'metadata-1',
	field: METADATA_TYPED_FILTER_FIELD,
	operator: FilterOperator.EQUAL,
	dataType: DataType.STRING,
	valueString: JSON.stringify(pairs),
});

describe('orgTypeMetadataFilterSync', () => {
	it('detects org_type in metadata filters', () => {
		expect(hasOrgTypeInMetadataFilters([metadataFilter([{ key: 'org_type', value: 'child' }])])).toBe(true);
		expect(hasOrgTypeInMetadataFilters([metadataFilter([{ key: 'tier', value: 'gold' }])])).toBe(false);
	});

	it('removes org_type rows from metadata filters', () => {
		const filters = [
			metadataFilter([
				{ key: 'org_type', value: 'child' },
				{ key: 'tier', value: 'gold' },
			]),
		];
		const next = removeOrgTypeFromMetadataFilters(filters);
		expect(JSON.parse(next[0].valueString!)).toEqual([{ key: 'tier', value: 'gold' }]);
	});
});
