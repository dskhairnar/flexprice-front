import type { PortalConfig } from '@/types/dto/PortalConfig';

export interface PortalVisibility {
	showInvoices: boolean;
	showWalletBalance: boolean;
	showUsage: boolean;
	showSubscriptions: boolean;
	showPaymentMethods: boolean;
}

export function getPortalVisibility(config: PortalConfig): PortalVisibility {
	return {
		showInvoices: config.sections.find((section) => section.id === 'invoices')?.enabled ?? false,
		showWalletBalance: config.sections.find((section) => section.id === 'credits')?.enabled ?? false,
		showUsage: config.sections.find((section) => section.id === 'usage')?.enabled ?? false,
		showSubscriptions: config.sections.some((section) => section.tabs.some((tab) => tab.type === 'subscriptions' && tab.enabled)),
		showPaymentMethods: config.sections.find((section) => section.id === 'payment_methods')?.enabled ?? false,
	};
}

export function applyPortalVisibility(config: PortalConfig, visibility: PortalVisibility): PortalConfig {
	return {
		...config,
		sections: config.sections.map((section) => {
			if (section.id === 'invoices') {
				return { ...section, enabled: visibility.showInvoices };
			}
			if (section.id === 'credits') {
				return { ...section, enabled: visibility.showWalletBalance };
			}
			if (section.id === 'usage') {
				return { ...section, enabled: visibility.showUsage };
			}
			if (section.id === 'payment_methods') {
				return { ...section, enabled: visibility.showPaymentMethods };
			}
			return {
				...section,
				tabs: section.tabs.map((tab) => (tab.type === 'subscriptions' ? { ...tab, enabled: visibility.showSubscriptions } : tab)),
			};
		}),
	};
}
