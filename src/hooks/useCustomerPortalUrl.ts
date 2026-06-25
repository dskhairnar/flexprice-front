import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import CustomerApi from '@/api/CustomerApi';
import { RouteNames } from '@/core/routes/Routes';
import toast from 'react-hot-toast';
import { logger } from '@/utils/common/Logger';

/**
 * Custom hook to generate and manage customer portal URL
 * @param customerExternalId - The customer external ID to generate portal URL for
 * @returns Object with portalUrl and copyToClipboard function
 */
export const useCustomerPortalUrl = (customerExternalId: string | undefined) => {
	const { t } = useTranslation();
	const portalUrl = useMemo(() => {
		if (!customerExternalId) return null;

		try {
			// Build the base customer portal URL (token will be added dynamically)
			const baseUrl = window.location.origin;
			const portalPath = RouteNames.customerPortal;
			const url = new URL(portalPath, baseUrl);

			return url.toString();
		} catch (error) {
			logger.error('Failed to generate customer portal URL', error);
			return null;
		}
	}, [customerExternalId]);

	/**
	 * Generates a complete portal URL with dashboard session token and copies it to clipboard
	 */
	const copyToClipboard = async () => {
		if (!customerExternalId) {
			toast.error(t('common:toast.customerExternalIdMissing'));
			return;
		}

		if (!portalUrl) {
			toast.error(t('common:toast.unablePortalUrl'));
			return;
		}

		try {
			// Create dashboard session to get token
			const sessionData = await CustomerApi.createDashboardSession(customerExternalId);
			if (!sessionData?.token) {
				toast.error(t('common:toast.unableDashboardSession'));
				return;
			}

			// Add token to URL
			const urlWithToken = new URL(portalUrl);
			urlWithToken.searchParams.set('token', sessionData.token);

			// Copy to clipboard
			await navigator.clipboard.writeText(urlWithToken.toString());
			toast.success(t('common:toast.customerPortalLinkCopied'));
		} catch (error) {
			logger.error('Failed to copy customer portal link', error);
			toast.error(t('common:toast.copyPortalLinkFailed'));
		}
	};

	/**
	 * Opens the customer portal in a new tab with dashboard session token
	 */
	const openInNewTab = async () => {
		if (!customerExternalId) {
			toast.error(t('common:toast.customerExternalIdMissing'));
			return;
		}

		if (!portalUrl) {
			toast.error(t('common:toast.unablePortalUrl'));
			return;
		}

		try {
			// Create dashboard session to get token
			const sessionData = await CustomerApi.createDashboardSession(customerExternalId);
			if (!sessionData?.token) {
				toast.error(t('common:toast.unableDashboardSession'));
				return;
			}

			// Add token to URL
			const urlWithToken = new URL(portalUrl);
			urlWithToken.searchParams.set('token', sessionData.token);

			// Open in new tab
			window.open(urlWithToken.toString(), '_blank', 'noopener,noreferrer');
		} catch (error) {
			logger.error('Failed to open customer portal', error);
			toast.error(t('common:toast.openPortalFailed'));
		}
	};

	return {
		portalUrl,
		copyToClipboard,
		openInNewTab,
	};
};
