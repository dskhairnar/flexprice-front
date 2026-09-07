import { Page, Locator, expect } from '@playwright/test';
import { dialog } from '../utils/selectors';

export type WalletAlertLevelTitle = 'Critical Threshold' | 'Warning Threshold' | 'Info Threshold';
export type WalletAlertThresholdType = 'Absolute' | 'Percentage';

/**
 * A customer's Wallet tab: creating a wallet and, once one exists, its Alert
 * Settings dialog (Absolute/Percentage thresholds).
 *
 * The wallet actions trigger (⋮) is icon-only with no accessible name — the app
 * gives it `aria-haspopup="menu"` but no `aria-label`, so it is addressed by that
 * attribute rather than by role+name. Radix's own menu items do carry a proper
 * `role="menuitem"` and their visible text as accessible name.
 *
 * WalletAlertThresholdCard's field labels are plain `<label>` elements with no
 * `for` binding (unlike the rest of the app's Select atom), so a Critical/Warning/
 * Info card is scoped by its title text plus its Add/Remove button, then addressed
 * by role inside that scope — `spinbutton` for the `<input type="number">` and
 * `combobox` for the condition Select.
 */
export class CustomerWalletPage {
	constructor(private readonly page: Page) {}

	async goto(customerId: string): Promise<void> {
		await this.page.goto(`/billing/customers/${customerId}`);
		await this.walletTab.click();
		await expect(this.walletTab).toHaveAttribute('aria-selected', 'true');
	}

	get walletTab(): Locator {
		return this.page.getByRole('tab', { name: 'Wallet' });
	}

	// ---- Empty state / wallet actions -------------------------------------------------

	get addWalletButton(): Locator {
		return this.page.getByRole('button', { name: 'Add Wallet', exact: true });
	}

	/** Icon-only "⋮" trigger beside Topup Wallet, present once a wallet already exists. */
	get walletActionsTrigger(): Locator {
		return this.page.locator('button[aria-haspopup="menu"]');
	}

	async openWalletActions(): Promise<void> {
		await this.walletActionsTrigger.click();
	}

	menuItem(name: string): Locator {
		return this.page.getByRole('menuitem', { name, exact: true });
	}

	get walletDetailsBalanceBadge(): Locator {
		return this.page.getByText(/balance (below|above)/i);
	}

	// ---- Create Wallet dialog ----------------------------------------------------------

	get createWalletDialog(): Locator {
		return dialog(this.page);
	}

	async openCreateWalletDialog(): Promise<void> {
		// The wallet list is behind its own query, so the tab renders a loading
		// skeleton before settling on either the empty-state CTA or the wallet
		// details view — wait for that to resolve before branching, rather than
		// taking an `isVisible()` snapshot that can race the skeleton.
		const trigger = this.addWalletButton.or(this.walletActionsTrigger);
		await expect(trigger.first()).toBeVisible();

		// Present via the empty-state CTA for a customer's first wallet, and via the
		// "Create Wallet" menu item once one already exists.
		if (await this.addWalletButton.isVisible()) {
			await this.addWalletButton.click();
		} else {
			await this.openWalletActions();
			await this.menuItem('Create Wallet').click();
		}
		await expect(this.createWalletDialog.getByText('Create Wallet', { exact: true })).toBeVisible();
	}

	async chooseCurrency(code: string): Promise<void> {
		// CurrencyPriceUnitSelector's <label> is not `for`-bound to the trigger, and its
		// accessible name did not resolve reliably via getByRole in practice, so this
		// addresses the verified DOM adjacency instead: the label is immediately
		// followed by the combobox trigger.
		await this.createWalletDialog.locator('label:text-is("Currency") + button[role="combobox"]').click();
		await this.page.getByRole('option', { name: code, exact: true }).click();
	}

	get saveWalletButton(): Locator {
		return this.createWalletDialog.getByRole('button', { name: 'Save Wallet', exact: true });
	}

	async createWallet(currency: string): Promise<void> {
		await this.openCreateWalletDialog();
		await this.chooseCurrency(currency);
		await this.saveWalletButton.click();
		await expect(this.createWalletDialog).toBeHidden();
	}

	// ---- Alert Settings dialog -----------------------------------------------------------

	get alertDialog(): Locator {
		return dialog(this.page);
	}

	async openAlertSettings(): Promise<void> {
		await this.openWalletActions();
		await this.menuItem('Alert Settings').click();
		await expect(this.alertDialog.getByText('Wallet Alert Settings', { exact: true })).toBeVisible();
	}

	get enableAlertsSwitch(): Locator {
		return this.alertDialog.getByRole('switch');
	}

	async setAlertsEnabled(enabled: boolean): Promise<void> {
		if ((await this.enableAlertsSwitch.isChecked()) !== enabled) await this.enableAlertsSwitch.click();
	}

	get thresholdTypeControl(): Locator {
		return this.alertDialog.getByRole('group', { name: 'Threshold type' });
	}

	async chooseThresholdType(type: WalletAlertThresholdType): Promise<void> {
		await this.thresholdTypeControl.getByRole('button', { name: type, exact: true }).click();
	}

	get percentageWarningBanner(): Locator {
		return this.alertDialog.getByText('Percentage alerts apply only to ongoing balance.', { exact: false });
	}

	/**
	 * Scopes to one Critical/Warning/Info card.
	 *
	 * WalletAlertThresholdCard nests its title `<label>` three `div`s below the card
	 * root (title wrapper -> header row -> card). `hasText`/`has` filters can't express
	 * "closest enclosing" — every ancestor div up to the dialog root also contains the
	 * title text and *an* Add/Remove button (there are three cards, each with one), so
	 * `.first()`/`.last()` over a filtered set lands on whichever div that predicate
	 * happens to match first or last, not the specific card. The XPath `ancestor` axis
	 * is defined in reverse document order, so `ancestor::div[3]` is unambiguous: the
	 * third-nearest div ancestor of the label, i.e. the card itself.
	 */
	card(title: WalletAlertLevelTitle): Locator {
		return this.alertDialog.locator(`xpath=//label[normalize-space(text())="${title}"]/ancestor::div[3]`);
	}

	async addThreshold(title: WalletAlertLevelTitle, value: string, condition: 'Below' | 'Above' = 'Below'): Promise<void> {
		const card = this.card(title);
		await card.getByRole('button', { name: 'Add', exact: true }).click();
		await card.getByRole('spinbutton').fill(value);
		// The condition Select's <label> isn't `for`-bound (same as Threshold Value),
		// so it is addressed by role within the card rather than via selectByLabel.
		if (condition !== 'Below') {
			await card.getByRole('combobox').click();
			await this.page.getByRole('option', { name: condition, exact: true }).click();
		}
	}

	thresholdValue(title: WalletAlertLevelTitle): Locator {
		return this.card(title).getByRole('spinbutton');
	}

	get saveAlertSettingsButton(): Locator {
		return this.alertDialog.getByRole('button', { name: 'Save Changes', exact: true });
	}

	async saveAlertSettings(): Promise<void> {
		await this.saveAlertSettingsButton.click();
	}
}
