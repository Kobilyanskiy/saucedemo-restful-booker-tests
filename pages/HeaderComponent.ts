import type { Locator, Page } from '@playwright/test';

// Header shared by every page after login: cart button, badge and side menu.
export class HeaderComponent {
  readonly cartButton: Locator;
  readonly cartBadge: Locator;
  readonly openMenuButton: Locator;
  readonly logoutLink: Locator;

  constructor(page: Page) {
    // Accessible name changes with content: "Cart, empty" / "Cart, 2 items".
    this.cartButton = page.getByRole('button', { name: /^Cart,/ });
    this.cartBadge = page.getByTestId('shopping-cart-badge');
    this.openMenuButton = page.getByRole('button', { name: 'Open Menu' });
    this.logoutLink = page.getByRole('button', { name: 'Logout' });
  }

  async openCart(): Promise<void> {
    await this.cartButton.click();
  }

  async logout(): Promise<void> {
    await this.openMenuButton.click();
    await this.logoutLink.click();
  }
}
