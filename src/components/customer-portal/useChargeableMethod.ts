import { useQuery } from '@tanstack/react-query';
import CustomerPortalApi from '@/api/CustomerPortalApi';
import type { SavedPaymentMethod } from '@/types/dto/CustomerPortalBilling';
import { portalPaymentMethodsQueryKey } from './queryKeys';
import usePortalIntegrations from './usePortalIntegrations';

/**
 * The saved method that could be charged with nobody present.
 *
 * can_auto_charge is a capability, not permission — a Razorpay token without a
 * mandate cannot be charged unattended even though it is a valid saved method.
 * Auto top-up needs one of these to be able to fire at all.
 */
const useChargeableMethod = () => {
	const { supports } = usePortalIntegrations();
	const canManage = supports('payment_method_management');

	const { data, isLoading } = useQuery({
		queryKey: portalPaymentMethodsQueryKey,
		queryFn: () => CustomerPortalApi.getPaymentMethods(),
		enabled: canManage,
	});

	const chargeable: SavedPaymentMethod[] = (data?.providers ?? [])
		.flatMap((group) => group.items)
		.filter((method) => method.can_auto_charge && method.status === 'ACTIVE');

	return {
		isLoading,
		chargeableMethods: chargeable,
		hasChargeableMethod: chargeable.length > 0,
		/** Prefers the provider default when several are chargeable. */
		preferredMethod: chargeable.find((method) => method.is_default) ?? chargeable[0],
	};
};

export default useChargeableMethod;
