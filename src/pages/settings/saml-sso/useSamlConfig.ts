import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import SettingsApi from '@/api/SettingsApi';
import { isHttpForbiddenError, isHttpNotFoundError } from '@/core/axios/types';
import { DEFAULT_SAML_CONFIG, mergeSamlConfig, toSamlConfigUpdatePayload, type SamlConfig } from '@/types/dto/SamlConfig';
import { SETTINGS_KEYS } from '../constants';
import { settingsQueryKeys } from '../queryKeys';

/** Thrown by the save mutation so the tab can tell "deployment doesn't offer SSO" apart from
 * a generic failure without re-parsing the error in the component. */
export class SamlDisabledError extends Error {}

async function fetchSamlConfig(): Promise<SamlConfig> {
	try {
		const setting = await SettingsApi.getSettingByKey(SETTINGS_KEYS.SAML_CONFIG);
		// A 200 with no saved value is treated the same as a 404: show the form with defaults.
		return mergeSamlConfig(DEFAULT_SAML_CONFIG, setting.value as Partial<SamlConfig> | null | undefined);
	} catch (error) {
		// A 404 here means the deployment does not offer SAML at all
		// (auth.saml.enabled=false), so the routes are not mounted and the key
		// cannot be configured. A tenant with nothing saved yet gets a 200
		// carrying server defaults, not a 404, so the two do not collide.
		if (isHttpNotFoundError(error)) throw new SamlDisabledError((error as Error).message);
		throw error;
	}
}

export function useSamlConfig() {
	const queryClient = useQueryClient();

	const query = useQuery({
		queryKey: settingsQueryKeys.samlConfig,
		queryFn: fetchSamlConfig,
	});

	const updateConfig = useMutation({
		mutationFn: async (config: SamlConfig) => {
			try {
				await SettingsApi.updateSettingByKey(SETTINGS_KEYS.SAML_CONFIG, { value: toSamlConfigUpdatePayload(config) });
			} catch (error) {
				// 404 on PUT means auth.saml.enabled=false for the whole deployment, distinct from
				// the GET 404 (which just means "nothing saved yet").
				if (isHttpNotFoundError(error)) throw new SamlDisabledError((error as Error).message);
				throw error;
			}
			return config;
		},
		onSuccess: () => {
			// Refetch rather than writing the submitted values into the cache.
			// `active` is decided by Flexprice and ignored on write, so the
			// submitted object is not what is now stored — seeding the cache with
			// it would show an approval state the server never reported.
			queryClient.invalidateQueries({ queryKey: settingsQueryKeys.samlConfig });
		},
	});

	const isForbidden = isHttpForbiddenError(query.error);
	const isSamlDisabled = query.error instanceof SamlDisabledError;

	return {
		config: query.data ?? DEFAULT_SAML_CONFIG,
		isLoading: query.isLoading,
		isError: query.isError,
		isForbidden,
		isSamlDisabled,
		// Whether this user should see SAML at all. Hidden when the deployment
		// does not offer it and when the caller may not administer it — reading
		// the configuration is super-admin-only, so anyone else would find an
		// empty tab they can do nothing with.
		//
		// Any other failure hides it too. The form falls back to defaults when
		// the read fails, so a 500 would otherwise show SSO as disabled and
		// unconfigured for a tenant where it is live — and saving from that state
		// would overwrite the real configuration with empty values.
		isAvailable: !query.isLoading && !query.isError,
		refetch: query.refetch,
		updateConfig,
	};
}
