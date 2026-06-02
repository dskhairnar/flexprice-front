import { describe, expect, it } from 'vitest';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { formatSubscriptionTypeDisplayLabel } from '@/utils/subscription/formatSubscriptionTypeDisplay';
import { SUBSCRIPTION_TYPE } from '@/models/Subscription';

void i18n.use(initReactI18next).init({
	lng: 'en',
	fallbackLng: 'en',
	resources: {
		en: {
			common: {
				apiEnums: {
					subscriptionType: {
						standalone: 'Standalone',
						delegatedInvoicing: 'Delegated invoicing',
						parent: 'Parent',
						inherited: 'Inherited',
						groupedInvoicing: 'Grouped invoicing',
					},
				},
			},
		},
	},
});

describe('formatSubscriptionTypeDisplayLabel', () => {
	const t = i18n.getFixedT('en', 'common');

	it('maps known subscription types to labels', () => {
		expect(formatSubscriptionTypeDisplayLabel(SUBSCRIPTION_TYPE.DELEGATED_INVOICING, t)).toBe('Delegated invoicing');
		expect(formatSubscriptionTypeDisplayLabel(SUBSCRIPTION_TYPE.GROUPED_INVOICING, t)).toBe('Grouped invoicing');
		expect(formatSubscriptionTypeDisplayLabel(undefined, t)).toBe('Standalone');
	});

	it('title-cases unknown snake_case values', () => {
		expect(formatSubscriptionTypeDisplayLabel('future_type_here', t)).toBe('Future Type Here');
	});
});
