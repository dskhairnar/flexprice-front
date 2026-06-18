import { describe, expect, it } from 'vitest';
import { mergeCustomerSearchMetadata } from './mergeCustomerSearchMetadata';

describe('mergeCustomerSearchMetadata', () => {
	it('returns base metadata unchanged when org type is not selected', () => {
		expect(mergeCustomerSearchMetadata({ tier: 'gold' }, null)).toEqual({ tier: 'gold' });
		expect(mergeCustomerSearchMetadata(undefined, null)).toBeUndefined();
	});

	it('adds org_type metadata when parent or child is selected', () => {
		expect(mergeCustomerSearchMetadata(undefined, 'parent')).toEqual({ org_type: 'parent' });
		expect(mergeCustomerSearchMetadata({ tier: 'gold' }, 'child')).toEqual({ tier: 'gold', org_type: 'child' });
	});

	it('keeps metadata filter org_type when both toolbar and metadata filter are set', () => {
		expect(mergeCustomerSearchMetadata({ org_type: 'child' }, 'parent')).toEqual({ org_type: 'child' });
	});
});
