import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * These cover a hosted deployment — one whose app.env is NOT self-hosted, so the
 * Supabase branch is the default source of a session. SAML is a per-tenant
 * feature that a hosted deployment may also offer, so a token minted by the
 * backend's SAML callback has to be honoured there too; resolving the session
 * purely from the environment meant a completed SSO login was silently ignored
 * and the dashboard loaded signed-out.
 */

const supabaseSession = { access_token: 'supabase-access-token' };
const supabaseUser = { id: 'supabase-user', email: 'supabase@example.com' };

const signOut = vi.fn();
const getSession = vi.fn(async () => ({ data: { session: supabaseSession } }));
const getUser = vi.fn(async () => ({ data: { user: supabaseUser } }));

vi.mock('@/config/config', () => ({
	// "production" is what the staging/production frontend builds resolve to.
	config: { app: { env: 'production' } },
	APP_ENV: { SelfHosted: 'self-hosted' },
}));

vi.mock('../services/supbase/config', () => ({
	default: { auth: { signOut, getSession, getUser } },
}));

vi.mock('../routes/Routes', () => ({ RouteNames: { login: '/login' } }));

// jsdom 26 does not allow window.location to be assigned, and redefining it on
// `window` detaches the other window-scoped globals (localStorage among them).
// A plain in-memory store keeps this file independent of that.
const store = new Map<string, string>();

beforeEach(() => {
	vi.resetModules();
	signOut.mockClear();
	getSession.mockClear();
	getUser.mockClear();
	store.clear();

	vi.stubGlobal('localStorage', {
		getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
		setItem: (key: string, value: string) => void store.set(key, String(value)),
		removeItem: (key: string) => void store.delete(key),
		clear: () => store.clear(),
		key: (index: number) => Array.from(store.keys())[index] ?? null,
		get length() {
			return store.size;
		},
	});
});

async function importService() {
	const mod = await import('./AuthService');
	return mod.default;
}

// The shape SamlCallback writes.
function storeSamlToken(token = 'saml-minted-token', tenantId = 'tenant_123') {
	localStorage.setItem('token', JSON.stringify({ token, tenant_id: tenantId }));
}

describe('AuthService on a hosted deployment with a SAML token present', () => {
	it('returns the SAML token rather than the Supabase session', async () => {
		storeSamlToken();

		const AuthService = await importService();

		expect(await AuthService.getAcessToken()).toBe('saml-minted-token');
	});

	it('does not consult Supabase at all when a SAML token is present', async () => {
		storeSamlToken();

		const AuthService = await importService();
		await AuthService.getAcessToken();

		expect(getSession).not.toHaveBeenCalled();
	});

	it('still uses Supabase when no SAML token was stored', async () => {
		const AuthService = await importService();

		expect(await AuthService.getAcessToken()).toBe('supabase-access-token');
		expect(getSession).toHaveBeenCalled();
	});

	// A half-written or corrupted entry must not strand the user with no way to
	// authenticate: fall back to the provider rather than throwing.
	it('falls back to Supabase when the stored token is not valid JSON', async () => {
		localStorage.setItem('token', 'not-json{');

		const AuthService = await importService();

		expect(await AuthService.getAcessToken()).toBe('supabase-access-token');
	});

	// The Supabase-shaped entry has no `token` field; treat it as absent.
	it('falls back to Supabase when the stored object carries no token field', async () => {
		localStorage.setItem('token', JSON.stringify({ tenant_id: 'tenant_123' }));

		const AuthService = await importService();

		expect(await AuthService.getAcessToken()).toBe('supabase-access-token');
	});

	// getUser has no SAML equivalent stored — SamlCallback deliberately omits
	// user_id — so the user is loaded from the API against the token instead.
	it('reports no Supabase user when the session came from SAML', async () => {
		storeSamlToken();

		const AuthService = await importService();

		expect(await AuthService.getUser()).toBeNull();
		expect(getUser).not.toHaveBeenCalled();
	});

	it('returns the Supabase user when no SAML token was stored', async () => {
		const AuthService = await importService();

		expect(await AuthService.getUser()).toEqual(supabaseUser);
	});

	// Logout must end BOTH sessions. Clearing only one leaves a usable
	// credential behind and the next visit silently signs back in.
	it('clears the SAML token and signs out of Supabase', async () => {
		storeSamlToken();

		const AuthService = await importService();
		await AuthService.logout();

		expect(localStorage.getItem('token')).toBeNull();
		expect(signOut).toHaveBeenCalled();
	});
});
