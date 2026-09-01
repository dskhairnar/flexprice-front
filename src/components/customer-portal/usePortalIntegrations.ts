import { useQuery } from '@tanstack/react-query';
import CustomerPortalApi from '@/api/CustomerPortalApi';
import type { IntegrationCapabilityType, PaymentGatewayType } from '@/types/dto/CustomerPortalBilling';

export const portalIntegrationsQueryKey = ['portal-integrations'] as const;

/**
 * Which providers are connected and what each can do.
 *
 * The portal should not offer an action no connected provider supports — a Add
 * card button is noise on a tenant whose only gateway cannot vault. Capabilities
 * come from connection rows at read time, so they cannot drift from reality.
 */
const usePortalIntegrations = () => {
	const { data, isLoading, isError } = useQuery({
		queryKey: portalIntegrationsQueryKey,
		queryFn: () => CustomerPortalApi.getIntegrations(),
	});

	const integrations = data?.payment_integrations ?? [];

	/** Providers supporting a capability, defaults first so callers can take [0]. */
	const providersFor = (capability: IntegrationCapabilityType): PaymentGatewayType[] =>
		integrations
			.filter((integration) => integration.capabilities.some((c) => c.type === capability))
			.sort((a, b) => {
				const aDefault = a.capabilities.some((c) => c.type === capability && c.is_default);
				const bDefault = b.capabilities.some((c) => c.type === capability && c.is_default);
				return Number(bDefault) - Number(aDefault);
			})
			.map((integration) => integration.provider);

	const supports = (capability: IntegrationCapabilityType) => providersFor(capability).length > 0;

	return {
		integrations,
		isLoading,
		isError,
		providersFor,
		supports,
		/** The provider to use when the customer is not asked to choose. */
		defaultProviderFor: (capability: IntegrationCapabilityType) => providersFor(capability)[0],
	};
};

export default usePortalIntegrations;
