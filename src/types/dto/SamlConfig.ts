/**
 * SAML SSO Configuration Types
 *
 * Stored in the settings API under key: saml_config
 * PUT /settings/saml_config replaces exactly the fields below the tenant is allowed to
 * edit. `active` is intentionally excluded from this type's editable fields — it is
 * Flexprice's own approval flag, flipped directly in the database, and the API silently
 * ignores it if sent in the PUT body.
 */

/** Roles the SAML JIT provisioner is allowed to grant. `super_admin` is deliberately absent —
 * the backend rejects it outright, since a SAML assertion must never be able to mint an admin. */
export const SAML_DEFAULT_ROLES = ['all_reader', 'all_writer'] as const;
export type SamlDefaultRole = (typeof SAML_DEFAULT_ROLES)[number];

export interface SamlConfig {
	enabled: boolean;
	idp_entity_id: string;
	idp_sso_url: string;
	idp_certificate: string;
	email_attribute: string;
	default_role: SamlDefaultRole | '';
	/** Read-only: Flexprice's approval that this tenant may serve SSO. Ignored by the API if sent. */
	active: boolean;
	/** When true, the backend refuses password login for this tenant's non-super_admin users. */
	enforce_sso: boolean;
}

export const DEFAULT_SAML_CONFIG: SamlConfig = {
	enabled: false,
	idp_entity_id: '',
	idp_sso_url: '',
	idp_certificate: '',
	email_attribute: '',
	default_role: '',
	active: false,
	enforce_sso: false,
};

/** The setting value arrives as `any`, so each field is checked rather than trusted. A value of the
 * wrong type would otherwise reach the form as-is and be written back on the next save — turning a
 * malformed stored value into a permanent one. Anything unusable falls back to the default. */
function asString(value: unknown, fallback: string): string {
	return typeof value === 'string' ? value : fallback;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
	return typeof value === 'boolean' ? value : fallback;
}

export function mergeSamlConfig(defaults: SamlConfig, saved: Partial<SamlConfig> | null | undefined): SamlConfig {
	if (!saved || typeof saved !== 'object') return defaults;

	// `default_role` is checked against the roles this form can actually offer: the backend refuses
	// super_admin, and an unrecognised role would leave the select with no matching option.
	const savedRole = saved.default_role as unknown;
	const default_role = SAML_DEFAULT_ROLES.includes(savedRole as SamlDefaultRole) ? (savedRole as SamlDefaultRole) : defaults.default_role;

	return {
		enabled: asBoolean(saved.enabled, defaults.enabled),
		idp_entity_id: asString(saved.idp_entity_id, defaults.idp_entity_id),
		idp_sso_url: asString(saved.idp_sso_url, defaults.idp_sso_url),
		idp_certificate: asString(saved.idp_certificate, defaults.idp_certificate),
		email_attribute: asString(saved.email_attribute, defaults.email_attribute),
		default_role,
		active: asBoolean(saved.active, defaults.active),
		enforce_sso: asBoolean(saved.enforce_sso, defaults.enforce_sso),
	};
}

/** Strips `active` before sending to the API — the field is read-only and the backend ignores it,
 * but omitting it makes that contract explicit at the call site instead of relying on server behavior. */
export function toSamlConfigUpdatePayload(config: SamlConfig): Omit<SamlConfig, 'active'> {
	const { active: _active, ...payload } = config;
	return payload;
}

/**
 * `idp_sso_url` must be `https://`. Plain `http://` is rejected by the backend except for
 * localhost / 127.0.0.1 / ::1, which exist purely to let a local IdP (e.g. simplesamlphp on
 * docker compose) be tested without TLS.
 */
export function isValidIdpSsoUrl(value: string): boolean {
	let url: URL;
	try {
		url = new URL(value);
	} catch {
		return false;
	}

	if (url.protocol === 'https:') return true;
	if (url.protocol !== 'http:') return false;

	const loopbackHosts = ['localhost', '127.0.0.1', '::1', '[::1]'];
	return loopbackHosts.includes(url.hostname);
}

/**
 * Whether two configurations hold the same values.
 *
 * Used before a save to notice that someone else changed the configuration since it was loaded.
 * `active` is excluded: it is Flexprice's approval flag, granted out of band, and a change to it
 * is not an edit this administrator would be overwriting.
 */
export function isSameSamlConfig(a: SamlConfig, b: SamlConfig): boolean {
	return (
		a.enabled === b.enabled &&
		a.enforce_sso === b.enforce_sso &&
		a.idp_entity_id === b.idp_entity_id &&
		a.idp_sso_url === b.idp_sso_url &&
		a.idp_certificate === b.idp_certificate &&
		a.email_attribute === b.email_attribute &&
		a.default_role === b.default_role
	);
}
