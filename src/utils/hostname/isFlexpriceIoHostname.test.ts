import { describe, expect, it } from 'vitest';
import { isFlexpriceIoHostname } from './isFlexpriceIoHostname';

describe('isFlexpriceIoHostname', () => {
	it('matches flexprice.io and subdomains', () => {
		expect(isFlexpriceIoHostname('flexprice.io')).toBe(true);
		expect(isFlexpriceIoHostname('in.flexprice.io')).toBe(true);
		expect(isFlexpriceIoHostname('us.flexprice.io')).toBe(true);
	});

	it('rejects other hostnames', () => {
		expect(isFlexpriceIoHostname('example.com')).toBe(false);
		expect(isFlexpriceIoHostname('notflexprice.io')).toBe(false);
		expect(isFlexpriceIoHostname('flexprice.io.evil.com')).toBe(false);
	});
});
