import { test, expect } from '../fixtures/test';

/**
 * The deployment health check: the smallest set of screens that, together, prove a
 * signed-in user can actually use the product. Read-only and fast by design — this
 * runs after every staging deploy and on a schedule, so it must not leave data
 * behind and must not take minutes.
 *
 * Each case asserts that the screen's own content rendered, not merely that the URL
 * changed. A blank page under the right URL is precisely the failure worth catching.
 */
test.describe('Critical journeys @smoke', () => {
	test('the cached session still authenticates', async ({ app, page }) => {
		await page.goto('/home');

		// AuthProvider sends an unauthenticated visitor to /auth — not /login — and it
		// does so after an async session check. A negative URL assertion alone passes
		// while that check is still in flight, so wait for authenticated content and
		// only then rule out both landing pages.
		await expect(app.navLink('Home')).toBeVisible();
		await expect(page).not.toHaveURL(/\/(auth|login)/);
	});

	test('customers list loads', async ({ customersPage, page }) => {
		await customersPage.goto();
		await expect(page).toHaveURL(/\/billing\/customers/);
	});

	test('plans list loads', async ({ app, page }) => {
		await page.goto('/product-catalog/plan');
		await app.expectPage('Plans');
	});

	test('invoices list loads', async ({ app, page }) => {
		await page.goto('/billing/invoices');
		await app.expectPage('Invoices');
	});

	test('subscriptions list loads', async ({ app, page }) => {
		await page.goto('/billing/subscriptions');
		await app.expectPage('Subscriptions');
	});
});
